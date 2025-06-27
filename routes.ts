import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { updateWeeklyEarningsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current week earnings
  app.get("/api/earnings/current", async (req, res) => {
    try {
      const currentWeek = await storage.getCurrentWeekEarnings();
      if (!currentWeek) {
        // Return empty structure for new week
        res.json({
          boltTotalEarnings: 0,
          uberTotalEarnings: 0,
          boltCashEarnings: 0,
          uberCashEarnings: 0,
          totalEarnings: 0,
          platformFee: 0,
          fixedDeduction: 25,
          totalCashEarnings: 0,
          netEarnings: 0,
        });
        return;
      }
      res.json(currentWeek);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current week earnings" });
    }
  });

  // Get previous week earnings
  app.get("/api/earnings/previous", async (req, res) => {
    try {
      const previousWeek = await storage.getPreviousWeekEarnings();
      res.json(previousWeek || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch previous week earnings" });
    }
  });

  // Update current week earnings
  app.patch("/api/earnings/current", async (req, res) => {
    try {
      const validatedData = updateWeeklyEarningsSchema.parse(req.body);
      const updatedEarnings = await storage.updateCurrentWeekEarnings(validatedData);
      res.json(updatedEarnings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
        return;
      }
      res.status(500).json({ message: "Failed to update earnings" });
    }
  });

  // Get week period info
  app.get("/api/earnings/week-info", async (req, res) => {
    try {
      const now = new Date();
      // Convert to GMT+2 (Romania timezone)
      const romaniaTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
      const dayOfWeek = romaniaTime.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      
      const currentWeekStart = new Date(romaniaTime);
      currentWeekStart.setDate(romaniaTime.getDate() + mondayOffset);
      currentWeekStart.setHours(0, 0, 0, 0);
      
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
      
      const previousWeekStart = new Date(currentWeekStart);
      previousWeekStart.setDate(currentWeekStart.getDate() - 7);
      
      const previousWeekEnd = new Date(previousWeekStart);
      previousWeekEnd.setDate(previousWeekStart.getDate() + 6);
      
      const nextResetDate = new Date(currentWeekStart);
      nextResetDate.setDate(currentWeekStart.getDate() + 7);
      
      res.json({
        currentWeek: {
          start: currentWeekStart.toISOString(),
          end: currentWeekEnd.toISOString(),
        },
        previousWeek: {
          start: previousWeekStart.toISOString(),
          end: previousWeekEnd.toISOString(),
        },
        nextReset: nextResetDate.toISOString(),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch week info" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
