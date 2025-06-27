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
exports.registerRoutes = registerRoutes;
const http_1 = require("http");
const storage_1 = require("./storage");
const schema_1 = require("@shared/schema");
const zod_1 = require("zod");
function registerRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get current week earnings
        app.get("/api/earnings/current", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const currentWeek = yield storage_1.storage.getCurrentWeekEarnings();
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
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch current week earnings" });
            }
        }));
        // Get previous week earnings
        app.get("/api/earnings/previous", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const previousWeek = yield storage_1.storage.getPreviousWeekEarnings();
                res.json(previousWeek || null);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch previous week earnings" });
            }
        }));
        // Update current week earnings
        app.patch("/api/earnings/current", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedData = schema_1.updateWeeklyEarningsSchema.parse(req.body);
                const updatedEarnings = yield storage_1.storage.updateCurrentWeekEarnings(validatedData);
                res.json(updatedEarnings);
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ message: "Invalid input data", errors: error.errors });
                    return;
                }
                res.status(500).json({ message: "Failed to update earnings" });
            }
        }));
        // Get week period info
        app.get("/api/earnings/week-info", (req, res) => __awaiter(this, void 0, void 0, function* () {
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
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch week info" });
            }
        }));
        const httpServer = (0, http_1.createServer)(app);
        return httpServer;
    });
}
