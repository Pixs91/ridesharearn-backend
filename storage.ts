import { weeklyEarnings, type WeeklyEarnings, type InsertWeeklyEarnings, type UpdateWeeklyEarnings } from "@shared/schema";

export interface IStorage {
  getCurrentWeekEarnings(): Promise<WeeklyEarnings | undefined>;
  getPreviousWeekEarnings(): Promise<WeeklyEarnings | undefined>;
  createWeeklyEarnings(earnings: InsertWeeklyEarnings): Promise<WeeklyEarnings>;
  updateCurrentWeekEarnings(earnings: UpdateWeeklyEarnings): Promise<WeeklyEarnings>;
  getAllWeeklyEarnings(): Promise<WeeklyEarnings[]>;
}

export class MemStorage implements IStorage {
  private weeklyEarnings: Map<number, WeeklyEarnings>;
  private currentId: number;

  constructor() {
    this.weeklyEarnings = new Map();
    this.currentId = 1;
  }

  private calculateEarnings(earnings: Partial<WeeklyEarnings>): {
    totalEarnings: number;
    platformFee: number;
    fixedDeduction: number;
    totalCashEarnings: number;
    netEarnings: number;
  } {
    const boltTotal = earnings.boltTotalEarnings || 0;
    const uberTotal = earnings.uberTotalEarnings || 0;
    const boltCash = earnings.boltCashEarnings || 0;
    const uberCash = earnings.uberCashEarnings || 0;

    const totalEarnings = boltTotal + uberTotal;
    const platformFee = (boltTotal + uberTotal) * 0.1; // 10% only on non-cash earnings
    const fixedDeduction = boltTotal + uberTotal > 999 ? 45 : 25;
    const totalCashEarnings = boltCash + uberCash;
    const netEarnings = (boltTotal + uberTotal) - platformFee - fixedDeduction - totalCashEarnings;

    return {
      totalEarnings,
      platformFee,
      fixedDeduction,
      totalCashEarnings,
      netEarnings,
    };
  }

  private getCurrentWeekStart(): Date {
    const now = new Date();
    // Convert to GMT+2 (Romania timezone)
    const romaniaTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    const dayOfWeek = romaniaTime.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday is 0, Monday is 1
    const monday = new Date(romaniaTime);
    monday.setDate(romaniaTime.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private getCurrentWeekEnd(): Date {
    const weekStart = this.getCurrentWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  private getPreviousWeekStart(): Date {
    const currentWeekStart = this.getCurrentWeekStart();
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);
    return previousWeekStart;
  }

  private getPreviousWeekEnd(): Date {
    const previousWeekStart = this.getPreviousWeekStart();
    const previousWeekEnd = new Date(previousWeekStart);
    previousWeekEnd.setDate(previousWeekStart.getDate() + 6);
    previousWeekEnd.setHours(23, 59, 59, 999);
    return previousWeekEnd;
  }

  async getCurrentWeekEarnings(): Promise<WeeklyEarnings | undefined> {
    const currentWeekStart = this.getCurrentWeekStart();
    const currentWeekEnd = this.getCurrentWeekEnd();
    
    return Array.from(this.weeklyEarnings.values()).find(
      (earnings) => 
        earnings.weekStartDate.getTime() === currentWeekStart.getTime() &&
        earnings.weekEndDate.getTime() === currentWeekEnd.getTime()
    );
  }

  async getPreviousWeekEarnings(): Promise<WeeklyEarnings | undefined> {
    const previousWeekStart = this.getPreviousWeekStart();
    const previousWeekEnd = this.getPreviousWeekEnd();
    
    return Array.from(this.weeklyEarnings.values()).find(
      (earnings) => 
        earnings.weekStartDate.getTime() === previousWeekStart.getTime() &&
        earnings.weekEndDate.getTime() === previousWeekEnd.getTime()
    );
  }

  async createWeeklyEarnings(insertEarnings: InsertWeeklyEarnings): Promise<WeeklyEarnings> {
    const calculations = this.calculateEarnings(insertEarnings);
    const id = this.currentId++;
    const earnings: WeeklyEarnings = {
      id,
      weekStartDate: insertEarnings.weekStartDate,
      weekEndDate: insertEarnings.weekEndDate,
      boltTotalEarnings: insertEarnings.boltTotalEarnings || 0,
      uberTotalEarnings: insertEarnings.uberTotalEarnings || 0,
      boltCashEarnings: insertEarnings.boltCashEarnings || 0,
      uberCashEarnings: insertEarnings.uberCashEarnings || 0,
      ...calculations,
      createdAt: new Date(),
    };
    
    this.weeklyEarnings.set(id, earnings);
    return earnings;
  }

  async updateCurrentWeekEarnings(updateEarnings: UpdateWeeklyEarnings): Promise<WeeklyEarnings> {
    let currentWeek = await this.getCurrentWeekEarnings();
    
    if (!currentWeek) {
      // Create new week if it doesn't exist
      const weekStart = this.getCurrentWeekStart();
      const weekEnd = this.getCurrentWeekEnd();
      
      currentWeek = await this.createWeeklyEarnings({
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        boltTotalEarnings: 0,
        uberTotalEarnings: 0,
        boltCashEarnings: 0,
        uberCashEarnings: 0,
      });
    }

    // Update with new values
    const updatedEarnings = {
      ...currentWeek,
      ...updateEarnings,
    };

    const calculations = this.calculateEarnings(updatedEarnings);
    const finalEarnings: WeeklyEarnings = {
      ...updatedEarnings,
      ...calculations,
    };

    this.weeklyEarnings.set(currentWeek.id, finalEarnings);
    return finalEarnings;
  }

  async getAllWeeklyEarnings(): Promise<WeeklyEarnings[]> {
    return Array.from(this.weeklyEarnings.values()).sort(
      (a, b) => b.weekStartDate.getTime() - a.weekStartDate.getTime()
    );
  }
}

export const storage = new MemStorage();
