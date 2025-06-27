"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.MemStorage = void 0;
class MemStorage {
    constructor() {
        this.weeklyEarnings = new Map();
        this.currentId = 1;
    }
    calculateEarnings(earnings) {
        const boltTotal = earnings.boltTotalEarnings || 0;
        const uberTotal = earnings.uberTotalEarnings || 0;
        const boltCash = earnings.boltCashEarnings || 0;
        const uberCash = earnings.uberCashEarnings || 0;
        const totalEarnings = boltTotal + uberTotal + boltCash + uberCash;
        const platformFee = (boltTotal + uberTotal) * 0.1; // 10% only on non-cash earnings
        const fixedDeduction = totalEarnings > 999 ? 45 : 25;
        const totalCashEarnings = boltCash + uberCash;
        const netEarnings = (boltTotal + uberTotal) - platformFee - fixedDeduction;
        return {
            totalEarnings,
            platformFee,
            fixedDeduction,
            totalCashEarnings,
            netEarnings,
        };
    }
    getCurrentWeekStart() {
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
    getCurrentWeekEnd() {
        const weekStart = this.getCurrentWeekStart();
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return weekEnd;
    }
    getPreviousWeekStart() {
        const currentWeekStart = this.getCurrentWeekStart();
        const previousWeekStart = new Date(currentWeekStart);
        previousWeekStart.setDate(currentWeekStart.getDate() - 7);
        return previousWeekStart;
    }
    getPreviousWeekEnd() {
        const previousWeekStart = this.getPreviousWeekStart();
        const previousWeekEnd = new Date(previousWeekStart);
        previousWeekEnd.setDate(previousWeekStart.getDate() + 6);
        previousWeekEnd.setHours(23, 59, 59, 999);
        return previousWeekEnd;
    }
    getCurrentWeekEarnings() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentWeekStart = this.getCurrentWeekStart();
            const currentWeekEnd = this.getCurrentWeekEnd();
            return Array.from(this.weeklyEarnings.values()).find((earnings) => earnings.weekStartDate.getTime() === currentWeekStart.getTime() &&
                earnings.weekEndDate.getTime() === currentWeekEnd.getTime());
        });
    }
    getPreviousWeekEarnings() {
        return __awaiter(this, void 0, void 0, function* () {
            const previousWeekStart = this.getPreviousWeekStart();
            const previousWeekEnd = this.getPreviousWeekEnd();
            return Array.from(this.weeklyEarnings.values()).find((earnings) => earnings.weekStartDate.getTime() === previousWeekStart.getTime() &&
                earnings.weekEndDate.getTime() === previousWeekEnd.getTime());
        });
    }
    createWeeklyEarnings(insertEarnings) {
        return __awaiter(this, void 0, void 0, function* () {
            const calculations = this.calculateEarnings(insertEarnings);
            const id = this.currentId++;
            const earnings = Object.assign(Object.assign({ id, weekStartDate: insertEarnings.weekStartDate, weekEndDate: insertEarnings.weekEndDate, boltTotalEarnings: insertEarnings.boltTotalEarnings || 0, uberTotalEarnings: insertEarnings.uberTotalEarnings || 0, boltCashEarnings: insertEarnings.boltCashEarnings || 0, uberCashEarnings: insertEarnings.uberCashEarnings || 0 }, calculations), { createdAt: new Date() });
            this.weeklyEarnings.set(id, earnings);
            return earnings;
        });
    }
    updateCurrentWeekEarnings(updateEarnings) {
        return __awaiter(this, void 0, void 0, function* () {
            let currentWeek = yield this.getCurrentWeekEarnings();
            if (!currentWeek) {
                // Create new week if it doesn't exist
                const weekStart = this.getCurrentWeekStart();
                const weekEnd = this.getCurrentWeekEnd();
                currentWeek = yield this.createWeeklyEarnings({
                    weekStartDate: weekStart,
                    weekEndDate: weekEnd,
                    boltTotalEarnings: 0,
                    uberTotalEarnings: 0,
                    boltCashEarnings: 0,
                    uberCashEarnings: 0,
                });
            }
            // Update with new values
            const updatedEarnings = Object.assign(Object.assign({}, currentWeek), updateEarnings);
            const calculations = this.calculateEarnings(updatedEarnings);
            const finalEarnings = Object.assign(Object.assign({}, updatedEarnings), calculations);
            this.weeklyEarnings.set(currentWeek.id, finalEarnings);
            return finalEarnings;
        });
    }
    getAllWeeklyEarnings() {
        return __awaiter(this, void 0, void 0, function* () {
            return Array.from(this.weeklyEarnings.values()).sort((a, b) => b.weekStartDate.getTime() - a.weekStartDate.getTime());
        });
    }
}
exports.MemStorage = MemStorage;
exports.storage = new MemStorage();
