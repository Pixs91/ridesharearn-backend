import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatWeekPeriod, formatNextReset, formatCurrency } from "@/lib/timezone";
import { Car, Wallet, Calculator, ChartLine, InfoIcon, Zap, Banknote, Download, X } from "lucide-react";

interface WeeklyEarnings {
  id?: number;
  boltTotalEarnings: number;
  uberTotalEarnings: number;
  boltCashEarnings: number;
  uberCashEarnings: number;
  totalEarnings: number;
  platformFee: number;
  fixedDeduction: number;
  totalCashEarnings: number;
  netEarnings: number;
}

interface WeekInfo {
  currentWeek: {
    start: string;
    end: string;
  };
  previousWeek: {
    start: string;
    end: string;
  };
  nextReset: string;
}

export default function EarningsTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [earnings, setEarnings] = useState({
    boltTotalEarnings: 0,
    uberTotalEarnings: 0,
    boltCashEarnings: 0,
    uberCashEarnings: 0,
  });

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual instructions for browsers that don't support beforeinstallprompt
      toast({
        title: "Install FirstClass Drive",
        description: "In Chrome: Menu (⋮) → Add to Home Screen. In Safari: Share → Add to Home Screen",
        duration: 8000,
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast({
        title: "App Installing",
        description: "FirstClass Drive is being added to your home screen",
      });
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  // Fetch current week earnings
  const { data: currentWeek, isLoading: currentLoading } = useQuery<WeeklyEarnings>({
    queryKey: ["/api/earnings/current"],
  });

  // Fetch previous week earnings
  const { data: previousWeek } = useQuery<WeeklyEarnings | null>({
    queryKey: ["/api/earnings/previous"],
  });

  // Fetch week info
  const { data: weekInfo } = useQuery<WeekInfo>({
    queryKey: ["/api/earnings/week-info"],
  });

  // Update earnings mutation
  const updateEarningsMutation = useMutation({
    mutationFn: async (data: Partial<WeeklyEarnings>) => {
      const response = await apiRequest("PATCH", "/api/earnings/current", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/earnings/current"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update earnings",
        variant: "destructive",
      });
    },
  });

  // Initialize form with current week data
  useEffect(() => {
    if (currentWeek) {
      setEarnings({
        boltTotalEarnings: currentWeek.boltTotalEarnings,
        uberTotalEarnings: currentWeek.uberTotalEarnings,
        boltCashEarnings: currentWeek.boltCashEarnings,
        uberCashEarnings: currentWeek.uberCashEarnings,
      });
    }
  }, [currentWeek]);

  // Debounced update effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentWeek) {
        const hasChanges = 
          earnings.boltTotalEarnings !== currentWeek.boltTotalEarnings ||
          earnings.uberTotalEarnings !== currentWeek.uberTotalEarnings ||
          earnings.boltCashEarnings !== currentWeek.boltCashEarnings ||
          earnings.uberCashEarnings !== currentWeek.uberCashEarnings;

        if (hasChanges) {
          updateEarningsMutation.mutate(earnings);
        }
      } else if (
        earnings.boltTotalEarnings > 0 ||
        earnings.uberTotalEarnings > 0 ||
        earnings.boltCashEarnings > 0 ||
        earnings.uberCashEarnings > 0
      ) {
        updateEarningsMutation.mutate(earnings);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [earnings]);

  const handleInputChange = (field: keyof typeof earnings, value: string) => {
    // Handle empty string to allow clearing the field
    if (value === '') {
      setEarnings(prev => ({
        ...prev,
        [field]: 0,
      }));
      return;
    }
    
    const numValue = Math.max(0, parseFloat(value) || 0);
    setEarnings(prev => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const displayData = currentWeek || {
    boltTotalEarnings: earnings.boltTotalEarnings,
    uberTotalEarnings: earnings.uberTotalEarnings,
    boltCashEarnings: earnings.boltCashEarnings,
    uberCashEarnings: earnings.uberCashEarnings,
    totalEarnings: earnings.boltTotalEarnings + earnings.uberTotalEarnings,
    platformFee: (earnings.boltTotalEarnings + earnings.uberTotalEarnings) * 0.1,
    fixedDeduction: (earnings.boltTotalEarnings + earnings.uberTotalEarnings) > 999 ? 45 : 25,
    totalCashEarnings: earnings.boltCashEarnings + earnings.uberCashEarnings,
    netEarnings: (earnings.boltTotalEarnings + earnings.uberTotalEarnings) - 
                 ((earnings.boltTotalEarnings + earnings.uberTotalEarnings) * 0.1) -
                 ((earnings.boltTotalEarnings + earnings.uberTotalEarnings) > 999 ? 45 : 25) - earnings.boltCashEarnings - earnings.uberCashEarnings,
  };

  const earningsDifference = previousWeek 
    ? displayData.netEarnings - previousWeek.netEarnings 
    : 0;

  if (currentLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="bg-primary h-32"></div>
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg h-96"></div>
              <div className="space-y-6">
                <div className="bg-white rounded-lg h-80"></div>
                <div className="bg-white rounded-lg h-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="bg-blue-600 text-white px-4 py-3 relative">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Download className="h-5 w-5" />
              <span className="text-sm font-medium">Install FirstClass Drive on your phone for quick access</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-blue-600 border-white hover:bg-white/10"
                onClick={handleInstallClick}
              >
                Install
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white hover:bg-white/10"
                onClick={() => setShowInstallPrompt(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Car className="h-8 w-8" />
              <h1 className="text-2xl font-bold">FirstClass Drive</h1>
            </div>
            <div className="text-right flex items-center space-x-4">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-white border-white hover:bg-white/10 hidden sm:flex"
                onClick={handleInstallClick}
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
              <div className="text-right">
                <p className="text-sm opacity-90">Current Week</p>
                <p className="font-semibold">
                  {weekInfo ? formatWeekPeriod(weekInfo.currentWeek.start, weekInfo.currentWeek.end) : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl text-secondary flex items-center">
                  <Wallet className="text-primary mr-3 h-5 w-5" />
                  Current Week Earnings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Total Earnings */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Total Earnings</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="boltTotal" className="flex items-center text-sm font-medium text-gray-600 mb-2">
                        <Zap className="text-yellow-500 mr-2 h-4 w-4" />
                        Bolt Total
                      </Label>
                      <div className="relative">
                        <Input
                          id="boltTotal"
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          value={earnings.boltTotalEarnings === 0 ? '' : earnings.boltTotalEarnings}
                          onChange={(e) => handleInputChange('boltTotalEarnings', e.target.value)}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">RON</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="uberTotal" className="flex items-center text-sm font-medium text-gray-600 mb-2">
                        <Car className="text-black mr-2 h-4 w-4" />
                        Uber Total
                      </Label>
                      <div className="relative">
                        <Input
                          id="uberTotal"
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          value={earnings.uberTotalEarnings === 0 ? '' : earnings.uberTotalEarnings}
                          onChange={(e) => handleInputChange('uberTotalEarnings', e.target.value)}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">RON</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cash Earnings */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Cash Earnings</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="boltCash" className="flex items-center text-sm font-medium text-gray-600 mb-2">
                        <Banknote className="text-green-500 mr-2 h-4 w-4" />
                        Bolt Cash
                      </Label>
                      <div className="relative">
                        <Input
                          id="boltCash"
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          value={earnings.boltCashEarnings === 0 ? '' : earnings.boltCashEarnings}
                          onChange={(e) => handleInputChange('boltCashEarnings', e.target.value)}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">RON</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="uberCash" className="flex items-center text-sm font-medium text-gray-600 mb-2">
                        <Banknote className="text-green-500 mr-2 h-4 w-4" />
                        Uber Cash
                      </Label>
                      <div className="relative">
                        <Input
                          id="uberCash"
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          value={earnings.uberCashEarnings === 0 ? '' : earnings.uberCashEarnings}
                          onChange={(e) => handleInputChange('uberCashEarnings', e.target.value)}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">RON</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calculation Section */}
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl text-secondary flex items-center">
                  <Calculator className="text-primary mr-3 h-5 w-5" />
                  Earnings Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Earnings</span>
                    <span className="font-semibold text-lg">{formatCurrency(displayData.totalEarnings)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Fleet Commission (10%)</span>
                    <span className="font-semibold text-warning">-{formatCurrency(displayData.platformFee)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Fixed Deduction</span>
                    <span className="font-semibold text-warning">-{formatCurrency(displayData.fixedDeduction)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Cash Earnings</span>
                    <span className="font-semibold text-success">+{formatCurrency(displayData.totalCashEarnings)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-t-2 border-success mt-6">
                    <span className="text-lg font-semibold text-success">Net Earnings</span>
                    <span className="text-2xl font-bold text-success">{formatCurrency(displayData.netEarnings)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Previous Week Comparison */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-secondary flex items-center">
                  <ChartLine className="text-primary mr-3 h-5 w-5" />
                  Previous Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Period</span>
                    <span className="font-medium">
                      {weekInfo ? formatWeekPeriod(weekInfo.previousWeek.start, weekInfo.previousWeek.end) : 'Loading...'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Net Earnings</span>
                    <span className="font-semibold">
                      {previousWeek ? formatCurrency(previousWeek.netEarnings) : 'No data'}
                    </span>
                  </div>
                  
                  {previousWeek && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Difference</span>
                      <span className={`font-semibold ${earningsDifference >= 0 ? 'text-success' : 'text-red-500'}`}>
                        {earningsDifference >= 0 ? '+' : ''}{formatCurrency(earningsDifference)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Weekly Reset Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <InfoIcon className="text-primary text-xl mt-1 h-5 w-5" />
            <div>
              <h3 className="font-semibold text-primary mb-2">Weekly Reset Information</h3>
              <p className="text-gray-700">
                Earnings reset automatically every Sunday at 00:00 GMT+2. Previous week's data is automatically saved for comparison.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Next reset: <span className="font-medium">
                  {weekInfo ? formatNextReset(weekInfo.nextReset) : 'Loading...'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
