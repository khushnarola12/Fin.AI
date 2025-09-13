"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@/components/spinner";
import { UserButton, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, DollarSign, CreditCard, Building, Trash2, PlusCircle, AlertCircle, Shield, BarChart3, Wallet, Loader2, Edit, MoreVertical, Sparkles, Star } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FinancialAnalytics } from "@/components/FinancialAnalytics";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";

// Type definitions - Fixed to use string IDs for UUIDs
interface Asset {
  id: string;
  name: string;
  type: string;
  value: number;
  updatedAt: string;
}

interface DashboardLiability {
  id: string;
  name: string;
  type: string;
  amount: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate: string;
  updatedAt: string;
}

interface Investment {
  id: string;
  name: string;
  type: string;
  shares: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  updatedAt: string;
}

interface PPFBalance {
  totalBalance: number | null;
  annualContribution: number | null;
  maturityAmount: number | null;
  interestRate: number | null;
}

interface NewAsset {
  name: string;
  type: string;
  value: string;
}

interface NewLiability {
  name: string;
  type: string;
  amount: string;
  interestRate: string;
  minimumPayment: string;
  dueDate: string;
}

interface NewInvestment {
  name: string;
  type: string;
  shares: string;
  currentPrice: string;
  purchasePrice: string;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  // Loading states
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSavingNetWorth, setIsSavingNetWorth] = useState(false);
  const [isSavingIncome, setIsSavingIncome] = useState(false);
  const [isSavingCredit, setIsSavingCredit] = useState(false);
  const [isSavingAssets, setIsSavingAssets] = useState(false);
  const [isSavingLiabilities, setIsSavingLiabilities] = useState(false);
  const [isSavingPpf, setIsSavingPpf] = useState(false);
  const [isSavingInvestments, setIsSavingInvestments] = useState(false);
  const [isDeletingAsset, setIsDeletingAsset] = useState<string | null>(null);
  const [isDeletingLiability, setIsDeletingLiability] = useState<string | null>(null);
  const [isDeletingInvestment, setIsDeletingInvestment] = useState<string | null>(null);

  // State for financial data
  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(null);
  const [creditScore, setCreditScore] = useState<number | null>(null);

  // State for assets
  const [assets, setAssets] = useState<Asset[]>([]);

  // State for liabilities
  const [liabilities, setLiabilities] = useState<DashboardLiability[]>([]);

  // State for PPF Balance
  const [ppfBalance, setPpfBalance] = useState<PPFBalance>({
    totalBalance: null,
    annualContribution: null,
    maturityAmount: null,
    interestRate: null
  });

  // State for investments
  const [investments, setInvestments] = useState<Investment[]>([]);

  // State for dialogs
  const [netWorthOpen, setNetWorthOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [liabilitiesOpen, setLiabilitiesOpen] = useState(false);
  const [ppfOpen, setPpfOpen] = useState(false);
  const [investmentsOpen, setInvestmentsOpen] = useState(false);

  // Edit states
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<DashboardLiability | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  // State for input values
  const [newNetWorth, setNewNetWorth] = useState("");
  const [newIncome, setNewIncome] = useState("");
  const [newCredit, setNewCredit] = useState("");

  // State for new assets form
  const [newAssets, setNewAssets] = useState<NewAsset[]>([{ name: "", type: "", value: "" }]);

  // State for new liabilities form
  const [newLiabilities, setNewLiabilities] = useState<NewLiability[]>([{
    name: "",
    type: "",
    amount: "",
    interestRate: "",
    minimumPayment: "",
    dueDate: ""
  }]);

  // State for PPF form
  const [newPpf, setNewPpf] = useState({
    totalBalance: "",
    annualContribution: "",
    maturityAmount: "",
    interestRate: ""
  });

  // State for new investments form
  const [newInvestments, setNewInvestments] = useState<NewInvestment[]>([{
    name: "",
    type: "",
    shares: "",
    currentPrice: "",
    purchasePrice: ""
  }]);

  // Load data from Supabase on component mount
  useEffect(() => {
    if (isLoaded && user?.emailAddresses?.[0]?.emailAddress) {
      loadUserData();
    }
  }, [isLoaded, user]);

  const loadUserData = async () => {
    if (!user?.emailAddresses?.[0]?.emailAddress) return;

    const userEmail = user.emailAddresses[0].emailAddress;
    setIsInitialLoading(true);

    try {
      // Create user if doesn't exist
      const { error: userError } = await supabase
        .from('users')
        .upsert({ email: userEmail }, { onConflict: 'email' });

      if (userError) throw userError;

      // Load user basic info
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (userData) {
        setNetWorth(userData.net_worth || null);
        setMonthlyIncome(userData.monthly_income || null);
        setCreditScore(userData.credit_score || null);
      }

      // Load assets - Keep as string IDs
      const { data: assetsData } = await supabase
        .from('assets')
        .select('*')
        .eq('user_email', userEmail);

      if (assetsData) {
        setAssets(assetsData.map(asset => ({
          id: asset.id, // Keep as string UUID
          name: asset.name,
          type: asset.type,
          value: asset.value,
          updatedAt: new Date(asset.updated_at).toLocaleDateString()
        })));
      }

      // Load liabilities - Keep as string IDs
      const { data: liabilitiesData } = await supabase
        .from('liabilities')
        .select('*')
        .eq('user_email', userEmail);

      if (liabilitiesData) {
        setLiabilities(liabilitiesData.map(liability => ({
          id: liability.id, // Keep as string UUID
          name: liability.name,
          type: liability.type,
          amount: liability.amount,
          interestRate: liability.interest_rate,
          minimumPayment: liability.minimum_payment,
          dueDate: liability.due_date || "Not specified",
          updatedAt: new Date(liability.updated_at).toLocaleDateString()
        })));
      }

      // Load PPF balance
      const { data: ppfData } = await supabase
        .from('ppf_balance')
        .select('*')
        .eq('user_email', userEmail)
        .single();

      if (ppfData) {
        setPpfBalance({
          totalBalance: ppfData.total_balance,
          annualContribution: ppfData.annual_contribution,
          maturityAmount: ppfData.maturity_amount,
          interestRate: ppfData.interest_rate
        });
      }

      // Load investments - Keep as string IDs
      const { data: investmentsData } = await supabase
        .from('investments')
        .select('*')
        .eq('user_email', userEmail);

      if (investmentsData) {
        setInvestments(investmentsData.map(investment => ({
          id: investment.id, // Keep as string UUID
          name: investment.name,
          type: investment.type,
          shares: investment.shares,
          currentPrice: investment.current_price,
          totalValue: investment.total_value,
          gainLoss: investment.gain_loss,
          gainLossPercentage: investment.gain_loss_percentage,
          updatedAt: new Date(investment.updated_at).toLocaleDateString()
        })));
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error("Failed to load your financial data. Please try again.");
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Basic update handlers (unchanged)
  const handleNetWorthUpdate = async () => {
    if (!newNetWorth || isNaN(Number(newNetWorth)) || !user?.emailAddresses?.[0]?.emailAddress) return;

    setIsSavingNetWorth(true);
    const userEmail = user.emailAddresses[0].emailAddress;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          net_worth: Number(newNetWorth),
          updated_at: new Date().toISOString()
        })
        .eq('email', userEmail);

      if (error) throw error;

      setNetWorth(Number(newNetWorth));
      setNewNetWorth("");
      setNetWorthOpen(false);
      toast.success("Net worth updated successfully!");
    } catch (error) {
      console.error('Error updating net worth:', error);
      toast.error("Failed to update net worth. Please try again.");
    } finally {
      setIsSavingNetWorth(false);
    }
  };

  const handleIncomeUpdate = async () => {
    if (!newIncome || isNaN(Number(newIncome)) || !user?.emailAddresses?.[0]?.emailAddress) return;

    setIsSavingIncome(true);
    const userEmail = user.emailAddresses[0].emailAddress;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          monthly_income: Number(newIncome),
          updated_at: new Date().toISOString()
        })
        .eq('email', userEmail);

      if (error) throw error;

      setMonthlyIncome(Number(newIncome));
      setNewIncome("");
      setIncomeOpen(false);
      toast.success("Monthly income updated successfully!");
    } catch (error) {
      console.error('Error updating income:', error);
      toast.error("Failed to update income. Please try again.");
    } finally {
      setIsSavingIncome(false);
    }
  };

  const handleCreditUpdate = async () => {
    if (!newCredit || isNaN(Number(newCredit)) || !user?.emailAddresses?.[0]?.emailAddress) return;

    setIsSavingCredit(true);
    const userEmail = user.emailAddresses[0].emailAddress;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          credit_score: Number(newCredit),
          updated_at: new Date().toISOString()
        })
        .eq('email', userEmail);

      if (error) throw error;

      setCreditScore(Number(newCredit));
      setNewCredit("");
      setCreditOpen(false);
      toast.success("Credit score updated successfully!");
    } catch (error) {
      console.error('Error updating credit score:', error);
      toast.error("Failed to update credit score. Please try again.");
    } finally {
      setIsSavingCredit(false);
    }
  };

  const handlePpfUpdate = async () => {
    if (!newPpf.totalBalance || isNaN(Number(newPpf.totalBalance)) || !user?.emailAddresses?.[0]?.emailAddress) return;

    setIsSavingPpf(true);
    const userEmail = user.emailAddresses[0].emailAddress;

    try {
      const { error } = await supabase
        .from('ppf_balance')
        .upsert({
          user_email: userEmail,
          total_balance: Number(newPpf.totalBalance),
          annual_contribution: newPpf.annualContribution ? Number(newPpf.annualContribution) : null,
          maturity_amount: newPpf.maturityAmount ? Number(newPpf.maturityAmount) : null,
          interest_rate: newPpf.interestRate ? Number(newPpf.interestRate) : null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_email' });

      if (error) throw error;

      setPpfBalance({
        totalBalance: Number(newPpf.totalBalance),
        annualContribution: newPpf.annualContribution ? Number(newPpf.annualContribution) : null,
        maturityAmount: newPpf.maturityAmount ? Number(newPpf.maturityAmount) : null,
        interestRate: newPpf.interestRate ? Number(newPpf.interestRate) : null
      });
      setNewPpf({ totalBalance: "", annualContribution: "", maturityAmount: "", interestRate: "" });
      setPpfOpen(false);
      toast.success("PPF balance updated successfully!");
    } catch (error) {
      console.error('Error updating PPF balance:', error);
      toast.error("Failed to update PPF balance. Please try again.");
    } finally {
      setIsSavingPpf(false);
    }
  };

  // Asset handlers with edit functionality - FIXED
  const handleAssetsSubmit = async () => {
    const validAssets = newAssets.filter(asset =>
      asset.name && asset.type && asset.value && !isNaN(Number(asset.value))
    );

    if (validAssets.length === 0 || !user?.emailAddresses?.[0]?.emailAddress) return;

    setIsSavingAssets(true);
    const userEmail = user.emailAddresses[0].emailAddress;

    try {
      if (editingAsset) {
        // Update existing asset - Use string ID directly
        const assetToUpdate = validAssets[0];
        const { error } = await supabase
          .from('assets')
          .update({
            name: assetToUpdate.name,
            type: assetToUpdate.type,
            value: Number(assetToUpdate.value),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAsset.id); // Use string ID directly

        if (error) throw error;

        const updatedAssets = assets.map(asset =>
          asset.id === editingAsset.id
            ? {
              ...asset,
              name: assetToUpdate.name,
              type: assetToUpdate.type,
              value: Number(assetToUpdate.value),
              updatedAt: new Date().toLocaleDateString()
            }
            : asset
        );

        setAssets(updatedAssets);
        toast.success("Asset updated successfully!");
      } else {
        // Add new assets
        const assetsToInsert = validAssets.map(asset => ({
          user_email: userEmail,
          name: asset.name,
          type: asset.type,
          value: Number(asset.value)
        }));

        const { data, error } = await supabase
          .from('assets')
          .insert(assetsToInsert)
          .select();

        if (error) throw error;

        const newAssetsData = data?.map(asset => ({
          id: asset.id, // Keep as string UUID
          name: asset.name,
          type: asset.type,
          value: asset.value,
          updatedAt: new Date(asset.created_at).toLocaleDateString()
        })) || [];

        setAssets([...assets, ...newAssetsData]);
        toast.success(`${validAssets.length} asset(s) added successfully!`);
      }

      setNewAssets([{ name: "", type: "", value: "" }]);
      setEditingAsset(null);
      setAssetsOpen(false);
    } catch (error) {
      console.error('Error saving assets:', error);
      toast.error("Failed to save assets. Please try again.");
    } finally {
      setIsSavingAssets(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => { // Use string type
    if (!user?.emailAddresses?.[0]?.emailAddress) return;

    setIsDeletingAsset(assetId);

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId); // Use string ID directly

      if (error) throw error;

      setAssets(assets.filter(asset => asset.id !== assetId));
      toast.success("Asset deleted successfully!");
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error("Failed to delete asset. Please try again.");
    } finally {
      setIsDeletingAsset(null);
    }
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setNewAssets([{
      name: asset.name,
      type: asset.type,
      value: asset.value.toString()
    }]);
    setAssetsOpen(true);
  };

  // Liability handlers with edit functionality - FIXED
  const handleLiabilitiesSubmit = async () => {
    const validLiabilities = newLiabilities.filter(liability =>
      liability.name && liability.type && liability.amount && !isNaN(Number(liability.amount))
    );

    if (validLiabilities.length === 0 || !user?.emailAddresses?.[0]?.emailAddress) return;

    setIsSavingLiabilities(true);
    const userEmail = user.emailAddresses[0].emailAddress;

    try {
      if (editingLiability) {
        // Update existing liability - Use string ID directly
        const liabilityToUpdate = validLiabilities[0];
        const { error } = await supabase
          .from('liabilities')
          .update({
            name: liabilityToUpdate.name,
            type: liabilityToUpdate.type,
            amount: Number(liabilityToUpdate.amount),
            interest_rate: liabilityToUpdate.interestRate ? Number(liabilityToUpdate.interestRate) : null,
            minimum_payment: liabilityToUpdate.minimumPayment ? Number(liabilityToUpdate.minimumPayment) : null,
            due_date: liabilityToUpdate.dueDate || "Not specified",
            updated_at: new Date().toISOString()
          })
          .eq('id', editingLiability.id); // Use string ID directly

        if (error) throw error;

        const updatedLiabilities = liabilities.map(liability =>
          liability.id === editingLiability.id
            ? {
              ...liability,
              name: liabilityToUpdate.name,
              type: liabilityToUpdate.type,
              amount: Number(liabilityToUpdate.amount),
              interestRate: liabilityToUpdate.interestRate ? Number(liabilityToUpdate.interestRate) : undefined,
              minimumPayment: liabilityToUpdate.minimumPayment ? Number(liabilityToUpdate.minimumPayment) : undefined,
              dueDate: liabilityToUpdate.dueDate || "Not specified",
              updatedAt: new Date().toLocaleDateString()
            }
            : liability
        );

        setLiabilities(updatedLiabilities);
        toast.success("Liability updated successfully!");
      } else {
        // Add new liabilities
        const liabilitiesToInsert = validLiabilities.map(liability => ({
          user_email: userEmail,
          name: liability.name,
          type: liability.type,
          amount: Number(liability.amount),
          interest_rate: liability.interestRate ? Number(liability.interestRate) : null,
          minimum_payment: liability.minimumPayment ? Number(liability.minimumPayment) : null,
          due_date: liability.dueDate || "Not specified"
        }));

        const { data, error } = await supabase
          .from('liabilities')
          .insert(liabilitiesToInsert)
          .select();

        if (error) throw error;

        const newLiabilitiesData = data?.map(liability => ({
          id: liability.id, // Keep as string UUID
          name: liability.name,
          type: liability.type,
          amount: liability.amount,
          interestRate: liability.interest_rate,
          minimumPayment: liability.minimum_payment,
          dueDate: liability.due_date || "Not specified",
          updatedAt: new Date(liability.created_at).toLocaleDateString()
        })) || [];

        setLiabilities([...liabilities, ...newLiabilitiesData]);
        toast.success(`${validLiabilities.length} liability(ies) added successfully!`);
      }

      setNewLiabilities([{ name: "", type: "", amount: "", interestRate: "", minimumPayment: "", dueDate: "" }]);
      setEditingLiability(null);
      setLiabilitiesOpen(false);
    } catch (error) {
      console.error('Error saving liabilities:', error);
      toast.error("Failed to save liabilities. Please try again.");
    } finally {
      setIsSavingLiabilities(false);
    }
  };

  const handleDeleteLiability = async (liabilityId: string) => { // Use string type
    if (!user?.emailAddresses?.[0]?.emailAddress) return;

    setIsDeletingLiability(liabilityId);

    try {
      const { error } = await supabase
        .from('liabilities')
        .delete()
        .eq('id', liabilityId); // Use string ID directly

      if (error) throw error;

      setLiabilities(liabilities.filter(liability => liability.id !== liabilityId));
      toast.success("Liability deleted successfully!");
    } catch (error) {
      console.error('Error deleting liability:', error);
      toast.error("Failed to delete liability. Please try again.");
    } finally {
      setIsDeletingLiability(null);
    }
  };

  const handleEditLiability = (liability: DashboardLiability) => {
    setEditingLiability(liability);
    setNewLiabilities([{
      name: liability.name,
      type: liability.type,
      amount: liability.amount.toString(),
      interestRate: liability.interestRate?.toString() || "",
      minimumPayment: liability.minimumPayment?.toString() || "",
      dueDate: liability.dueDate === "Not specified" ? "" : liability.dueDate
    }]);
    setLiabilitiesOpen(true);
  };

  // Investment handlers with edit functionality - FIXED
  const handleInvestmentsSubmit = async () => {
    const validInvestments = newInvestments.filter(investment =>
      investment.name && investment.type && investment.shares && investment.currentPrice && investment.purchasePrice &&
      !isNaN(Number(investment.shares)) && !isNaN(Number(investment.currentPrice)) && !isNaN(Number(investment.purchasePrice))
    );

    if (validInvestments.length === 0 || !user?.emailAddresses?.[0]?.emailAddress) return;

    setIsSavingInvestments(true);
    const userEmail = user.emailAddresses[0].emailAddress;

    try {
      if (editingInvestment) {
        // Update existing investment - Use string ID directly
        const investmentToUpdate = validInvestments[0];
        const shares = Number(investmentToUpdate.shares);
        const currentPrice = Number(investmentToUpdate.currentPrice);
        const purchasePrice = Number(investmentToUpdate.purchasePrice);
        const totalValue = shares * currentPrice;
        const totalCost = shares * purchasePrice;
        const gainLoss = totalValue - totalCost;
        const gainLossPercentage = ((gainLoss / totalCost) * 100);

        const { error } = await supabase
          .from('investments')
          .update({
            name: investmentToUpdate.name,
            type: investmentToUpdate.type,
            shares,
            current_price: currentPrice,
            purchase_price: purchasePrice,
            total_value: totalValue,
            gain_loss: gainLoss,
            gain_loss_percentage: gainLossPercentage,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingInvestment.id); // Use string ID directly

        if (error) throw error;

        const updatedInvestments = investments.map(investment =>
          investment.id === editingInvestment.id
            ? {
              ...investment,
              name: investmentToUpdate.name,
              type: investmentToUpdate.type,
              shares,
              currentPrice,
              totalValue,
              gainLoss,
              gainLossPercentage,
              updatedAt: new Date().toLocaleDateString()
            }
            : investment
        );

        setInvestments(updatedInvestments);
        toast.success("Investment updated successfully!");
      } else {
        // Add new investments
        const investmentsToInsert = validInvestments.map(investment => {
          const shares = Number(investment.shares);
          const currentPrice = Number(investment.currentPrice);
          const purchasePrice = Number(investment.purchasePrice);
          const totalValue = shares * currentPrice;
          const totalCost = shares * purchasePrice;
          const gainLoss = totalValue - totalCost;
          const gainLossPercentage = ((gainLoss / totalCost) * 100);

          return {
            user_email: userEmail,
            name: investment.name,
            type: investment.type,
            shares,
            current_price: currentPrice,
            purchase_price: purchasePrice,
            total_value: totalValue,
            gain_loss: gainLoss,
            gain_loss_percentage: gainLossPercentage
          };
        });

        const { data, error } = await supabase
          .from('investments')
          .insert(investmentsToInsert)
          .select();

        if (error) throw error;

        const newInvestmentsData = data?.map(investment => ({
          id: investment.id, // Keep as string UUID
          name: investment.name,
          type: investment.type,
          shares: investment.shares,
          currentPrice: investment.current_price,
          totalValue: investment.total_value,
          gainLoss: investment.gain_loss,
          gainLossPercentage: investment.gain_loss_percentage,
          updatedAt: new Date(investment.created_at).toLocaleDateString()
        })) || [];

        setInvestments([...investments, ...newInvestmentsData]);
        toast.success(`${validInvestments.length} investment(s) added successfully!`);
      }

      setNewInvestments([{ name: "", type: "", shares: "", currentPrice: "", purchasePrice: "" }]);
      setEditingInvestment(null);
      setInvestmentsOpen(false);
    } catch (error) {
      console.error('Error saving investments:', error);
      toast.error("Failed to save investments. Please try again.");
    } finally {
      setIsSavingInvestments(false);
    }
  };

  const handleDeleteInvestment = async (investmentId: string) => { // Use string type
    if (!user?.emailAddresses?.[0]?.emailAddress) return;

    setIsDeletingInvestment(investmentId);

    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', investmentId); // Use string ID directly

      if (error) throw error;

      setInvestments(investments.filter(investment => investment.id !== investmentId));
      toast.success("Investment deleted successfully!");
    } catch (error) {
      console.error('Error deleting investment:', error);
      toast.error("Failed to delete investment. Please try again.");
    } finally {
      setIsDeletingInvestment(null);
    }
  };

  const handleEditInvestment = (investment: Investment) => {
    setEditingInvestment(investment);
    // Calculate purchase price from current data
    const purchasePrice = investment.totalValue / investment.shares;
    setNewInvestments([{
      name: investment.name,
      type: investment.type,
      shares: investment.shares.toString(),
      currentPrice: investment.currentPrice.toString(),
      purchasePrice: (purchasePrice - (investment.gainLoss / investment.shares)).toFixed(2)
    }]);
    setInvestmentsOpen(true);
  };

  const handleDeletePpf = async () => {
    if (!user?.emailAddresses?.[0]?.emailAddress) return;

    setIsSavingPpf(true);
    const userEmail = user.emailAddresses[0].emailAddress;

    try {
      const { error } = await supabase
        .from('ppf_balance')
        .delete()
        .eq('user_email', userEmail);

      if (error) throw error;

      setPpfBalance({
        totalBalance: null,
        annualContribution: null,
        maturityAmount: null,
        interestRate: null
      });
      toast.success("PPF balance deleted successfully!");
    } catch (error) {
      console.error('Error deleting PPF balance:', error);
      toast.error("Failed to delete PPF balance. Please try again.");
    } finally {
      setIsSavingPpf(false);
    }
  };

  const handleEditPpf = () => {
    setNewPpf({
      totalBalance: ppfBalance.totalBalance?.toString() || "",
      annualContribution: ppfBalance.annualContribution?.toString() || "",
      maturityAmount: ppfBalance.maturityAmount?.toString() || "",
      interestRate: ppfBalance.interestRate?.toString() || ""
    });
    setPpfOpen(true);
  };

  // Helper functions (unchanged)
  const addNewAssetField = () => {
    setNewAssets([...newAssets, { name: "", type: "", value: "" }]);
  };

  const removeAssetField = (index: number) => {
    if (newAssets.length > 1) {
      setNewAssets(newAssets.filter((_, i) => i !== index));
    }
  };

  const addNewLiabilityField = () => {
    setNewLiabilities([...newLiabilities, {
      name: "",
      type: "",
      amount: "",
      interestRate: "",
      minimumPayment: "",
      dueDate: ""
    }]);
  };

  const removeLiabilityField = (index: number) => {
    if (newLiabilities.length > 1) {
      setNewLiabilities(newLiabilities.filter((_, i) => i !== index));
    }
  };

  const addNewInvestmentField = () => {
    setNewInvestments([...newInvestments, {
      name: "",
      type: "",
      shares: "",
      currentPrice: "",
      purchasePrice: ""
    }]);
  };

  const removeInvestmentField = (index: number) => {
    if (newInvestments.length > 1) {
      setNewInvestments(newInvestments.filter((_, i) => i !== index));
    }
  };

  const updateAssetField = (index: number, field: keyof NewAsset, value: string) => {
    const updatedAssets = newAssets.map((asset, i) =>
      i === index ? { ...asset, [field]: value } : asset
    );
    setNewAssets(updatedAssets);
  };

  const updateLiabilityField = (index: number, field: keyof NewLiability, value: string) => {
    const updatedLiabilities = newLiabilities.map((liability, i) =>
      i === index ? { ...liability, [field]: value } : liability
    );
    setNewLiabilities(updatedLiabilities);
  };

  const updateInvestmentField = (index: number, field: keyof NewInvestment, value: string) => {
    const updatedInvestments = newInvestments.map((investment, i) =>
      i === index ? { ...investment, [field]: value } : investment
    );
    setNewInvestments(updatedInvestments);
  };

  // Reset editing states when dialogs close
  const handleAssetsDialogClose = (open: boolean) => {
    if (!open) {
      setEditingAsset(null);
      setNewAssets([{ name: "", type: "", value: "" }]);
    }
    setAssetsOpen(open);
  };

  const handleLiabilitiesDialogClose = (open: boolean) => {
    if (!open) {
      setEditingLiability(null);
      setNewLiabilities([{ name: "", type: "", amount: "", interestRate: "", minimumPayment: "", dueDate: "" }]);
    }
    setLiabilitiesOpen(open);
  };

  const handleInvestmentsDialogClose = (open: boolean) => {
    if (!open) {
      setEditingInvestment(null);
      setNewInvestments([{ name: "", type: "", shares: "", currentPrice: "", purchasePrice: "" }]);
    }
    setInvestmentsOpen(open);
  };

  const handlePpfDialogClose = (open: boolean) => {
    if (!open) {
      setNewPpf({ totalBalance: "", annualContribution: "", maturityAmount: "", interestRate: "" });
    }
    setPpfOpen(open);
  };

  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0);
  const totalInvestmentValue = investments.reduce((sum, investment) => sum + investment.totalValue, 0);

  const assetTypes = ["Bank", "Cash", "Property", "Investment", "Gold", "Mutual Fund", "FD", "Other"];
  const liabilityTypes = ["Home Loan", "Car Loan", "Personal Loan", "Credit Card", "Education Loan", "Business Loan", "Other"];
  const investmentTypes = ["Stock", "Mutual Fund", "ETF", "Bond", "SIP", "ELSS", "Gold ETF", "Other"];

  const getCreditScoreStatus = (score: number) => {
    if (score >= 750) return { label: "Excellent", color: "bg-green-100 text-green-800" };
    if (score >= 700) return { label: "Good", color: "bg-blue-100 text-blue-800" };
    if (score >= 650) return { label: "Fair", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Poor", color: "bg-red-100 text-red-800" };
  };

  if (!isLoaded || isInitialLoading) {
    return <div className="h-screen w-full flex justify-center items-center"> <Spinner /> </div>;
  }

  if (!user) {
    return <div className="h-screen w-full flex justify-center items-center">Please sign in to continue.</div>;
  }

  return (
    <>
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold text-foreground">
              Fin.<span className="text-green-600">AI</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Hello, {user?.firstName}
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's your comprehensive financial dashboard with AI-powered insights
          </p>
        </div>

        {/* Tab Navigation */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <Wallet className="h-4 w-4" />
                <span>Portfolio</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-3">
              <Link href={"/chat-with-fin"}>
                <Button className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white transition-all duration-300">
                  <Sparkles /> Chat with Fin.AI
                </Button>
              </Link>
              <Link href={"/call-with-fin"}>
                <Button className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white transition-all duration-300">
                  <Sparkles /> Call with Fin.AI
                </Button>
              </Link>
            </div>
          </div>

          {/* Portfolio Tab Content */}
          <TabsContent value="overview" className="space-y-8">
            {/* Financial Overview Cards - Unchanged */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Net Worth Card */}
              <Card className="border border-border shadow-none bg-green-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Net Worth
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <Dialog open={netWorthOpen} onOpenChange={setNetWorthOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader className="space-y-3">
                          <DialogTitle className="text-xl">Update Net Worth</DialogTitle>
                          <DialogDescription>
                            Enter your current net worth value in INR.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="networth" className="text-sm font-medium">
                              Net Worth (₹)
                            </Label>
                            <Input
                              id="networth"
                              type="number"
                              placeholder="1500000"
                              value={newNetWorth}
                              onChange={(e) => setNewNetWorth(e.target.value)}
                              className="h-10"
                              disabled={isSavingNetWorth}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setNetWorthOpen(false)}
                            className="h-10 px-4"
                            disabled={isSavingNetWorth}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleNetWorthUpdate}
                            className="h-10 px-4 bg-green-600 hover:bg-green-700"
                            disabled={isSavingNetWorth}
                          >
                            {isSavingNetWorth ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Update"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {netWorth !== null ? (
                    <>
                      <div className="text-2xl font-bold text-foreground">
                        ₹{netWorth.toLocaleString()}
                      </div>
                      <p className="text-sm text-green-600">+2.5% from last month</p>
                    </>
                  ) : (
                    <div className="text-center py-4 space-y-3">
                      <div className="text-muted-foreground text-sm">No net worth data yet</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNetWorthOpen(true)}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Net Worth
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Income Card */}
              <Card className="border border-border shadow-none bg-green-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Monthly Income
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <Dialog open={incomeOpen} onOpenChange={setIncomeOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader className="space-y-3">
                          <DialogTitle className="text-xl">Update Monthly Income</DialogTitle>
                          <DialogDescription>
                            Enter your total monthly income including freelance work.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="income" className="text-sm font-medium">
                              Monthly Income (₹)
                            </Label>
                            <Input
                              id="income"
                              type="number"
                              placeholder="125000"
                              value={newIncome}
                              onChange={(e) => setNewIncome(e.target.value)}
                              className="h-10"
                              disabled={isSavingIncome}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setIncomeOpen(false)}
                            className="h-10 px-4"
                            disabled={isSavingIncome}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleIncomeUpdate}
                            className="h-10 px-4 bg-green-600 hover:bg-green-700"
                            disabled={isSavingIncome}
                          >
                            {isSavingIncome ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Update"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {monthlyIncome !== null ? (
                    <>
                      <div className="text-2xl font-bold text-foreground">
                        ₹{monthlyIncome.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Including freelance work</p>
                    </>
                  ) : (
                    <div className="text-center py-4 space-y-3">
                      <div className="text-muted-foreground text-sm">No income data yet</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIncomeOpen(true)}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Income
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Credit Score Card */}
              <Card className="border border-border shadow-none bg-green-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Credit Score
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    <Dialog open={creditOpen} onOpenChange={setCreditOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader className="space-y-3">
                          <DialogTitle className="text-xl">Update Credit Score</DialogTitle>
                          <DialogDescription>
                            Enter your current CIBIL score (300-850).
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="credit" className="text-sm font-medium">
                              CIBIL Score
                            </Label>
                            <Input
                              id="credit"
                              type="number"
                              placeholder="750"
                              min="300"
                              max="850"
                              value={newCredit}
                              onChange={(e) => setNewCredit(e.target.value)}
                              className="h-10"
                              disabled={isSavingCredit}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setCreditOpen(false)}
                            className="h-10 px-4"
                            disabled={isSavingCredit}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreditUpdate}
                            className="h-10 px-4 bg-green-600 hover:bg-green-700"
                            disabled={isSavingCredit}
                          >
                            {isSavingCredit ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Update"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {creditScore !== null ? (
                    <>
                      <div className="text-2xl font-bold text-foreground">{creditScore}</div>
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getCreditScoreStatus(creditScore).color}`}>
                        {getCreditScoreStatus(creditScore).label}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 space-y-3">
                      <div className="text-muted-foreground text-sm">No credit score yet</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCreditOpen(true)}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Score
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Assets Section with Edit/Delete */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
                      <Building className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">Assets</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your financial assets and their current values
                      </p>
                    </div>
                  </div>
                  <Dialog open={assetsOpen} onOpenChange={handleAssetsDialogClose}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Assets
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader className="space-y-3 pb-6">
                        <DialogTitle className="text-xl">
                          {editingAsset ? "Edit Asset" : "Add New Assets"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingAsset
                            ? "Update the asset details below."
                            : "Add one or more assets to your portfolio. You can add multiple assets at once."
                          }
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {newAssets.map((asset, index) => (
                          <div key={index} className="rounded-lg border border-border p-6 space-y-4 bg-card">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-foreground">Asset {index + 1}</h4>
                              {newAssets.length > 1 && !editingAsset && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAssetField(index)}
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`asset-name-${index}`} className="text-sm font-medium">
                                  Asset Name
                                </Label>
                                <Input
                                  id={`asset-name-${index}`}
                                  placeholder="e.g., Savings Account"
                                  value={asset.name}
                                  onChange={(e) => updateAssetField(index, 'name', e.target.value)}
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`asset-type-${index}`} className="text-sm font-medium">
                                  Asset Type
                                </Label>
                                <Select
                                  value={asset.type}
                                  onValueChange={(value) => updateAssetField(index, 'type', value)}
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {assetTypes.map((type) => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`asset-value-${index}`} className="text-sm font-medium">
                                  Value (₹)
                                </Label>
                                <Input
                                  id={`asset-value-${index}`}
                                  type="number"
                                  placeholder="250000"
                                  value={asset.value}
                                  onChange={(e) => updateAssetField(index, 'value', e.target.value)}
                                  className="h-10"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {!editingAsset && (
                          <Button
                            variant="outline"
                            onClick={addNewAssetField}
                            className="w-full h-12 border-dashed border-green-200 text-green-600 hover:bg-green-50"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Asset
                          </Button>
                        )}
                      </div>
                      <div className="flex justify-end space-x-3 pt-6 border-t border-border">
                        <Button
                          variant="outline"
                          onClick={() => handleAssetsDialogClose(false)}
                          className="h-10 px-4"
                          disabled={isSavingAssets}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAssetsSubmit}
                          className="h-10 px-4 bg-green-600 hover:bg-green-700"
                          disabled={isSavingAssets}
                        >
                          {isSavingAssets ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            editingAsset ? "Update Asset" : "Add Assets"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {assets.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {assets.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                          <div className="space-y-1">
                            <h3 className="font-medium text-foreground">{asset.name}</h3>
                            <p className="text-sm text-muted-foreground">{asset.type}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right space-y-1">
                              <div className="font-semibold text-foreground">
                                ₹{asset.value.toLocaleString()}
                              </div>
                              <p className="text-xs text-muted-foreground">Updated {asset.updatedAt}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  disabled={isDeletingAsset === asset.id}
                                >
                                  {isDeletingAsset === asset.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteAsset(asset.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-6" />

                    <div className="flex items-center justify-between py-2">
                      <span className="text-lg font-semibold text-foreground">Total Assets</span>
                      <span className="text-2xl font-bold text-green-600">
                        ₹{totalAssets.toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Building className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-foreground">No assets yet</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Start building your financial portfolio by adding your first asset. Track savings, investments, property, and more.
                      </p>
                    </div>
                    <Button
                      onClick={() => setAssetsOpen(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Your First Asset
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Liabilities Section with Edit/Delete */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">Liabilities</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your debts and outstanding balances
                      </p>
                    </div>
                  </div>
                  <Dialog open={liabilitiesOpen} onOpenChange={handleLiabilitiesDialogClose}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Liabilities
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader className="space-y-3 pb-6">
                        <DialogTitle className="text-xl">
                          {editingLiability ? "Edit Liability" : "Add New Liabilities"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingLiability
                            ? "Update the liability details below."
                            : "Add one or more debts or liabilities. You can add multiple liabilities at once."
                          }
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {newLiabilities.map((liability, index) => (
                          <div key={index} className="rounded-lg border border-border p-6 space-y-4 bg-card">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-foreground">Liability {index + 1}</h4>
                              {newLiabilities.length > 1 && !editingLiability && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLiabilityField(index)}
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`liability-name-${index}`} className="text-sm font-medium">
                                  Liability Name
                                </Label>
                                <Input
                                  id={`liability-name-${index}`}
                                  placeholder="e.g., Home Loan"
                                  value={liability.name}
                                  onChange={(e) => updateLiabilityField(index, 'name', e.target.value)}
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`liability-type-${index}`} className="text-sm font-medium">
                                  Liability Type
                                </Label>
                                <Select
                                  value={liability.type}
                                  onValueChange={(value) => updateLiabilityField(index, 'type', value)}
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {liabilityTypes.map((type) => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`liability-amount-${index}`} className="text-sm font-medium">
                                  Amount (₹)
                                </Label>
                                <Input
                                  id={`liability-amount-${index}`}
                                  type="number"
                                  placeholder="3500000"
                                  value={liability.amount}
                                  onChange={(e) => updateLiabilityField(index, 'amount', e.target.value)}
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`liability-rate-${index}`} className="text-sm font-medium">
                                  Interest Rate (%)
                                </Label>
                                <Input
                                  id={`liability-rate-${index}`}
                                  type="number"
                                  step="0.1"
                                  placeholder="9.5"
                                  value={liability.interestRate}
                                  onChange={(e) => updateLiabilityField(index, 'interestRate', e.target.value)}
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`liability-minimum-${index}`} className="text-sm font-medium">
                                  Minimum Payment (₹)
                                </Label>
                                <Input
                                  id={`liability-minimum-${index}`}
                                  type="number"
                                  placeholder="25000"
                                  value={liability.minimumPayment}
                                  onChange={(e) => updateLiabilityField(index, 'minimumPayment', e.target.value)}
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`liability-due-${index}`} className="text-sm font-medium">
                                  Due Date
                                </Label>
                                <Input
                                  id={`liability-due-${index}`}
                                  type="date"
                                  value={liability.dueDate}
                                  onChange={(e) => updateLiabilityField(index, 'dueDate', e.target.value)}
                                  className="h-10"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {!editingLiability && (
                          <Button
                            variant="outline"
                            onClick={addNewLiabilityField}
                            className="w-full h-12 border-dashed border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Liability
                          </Button>
                        )}
                      </div>
                      <div className="flex justify-end space-x-3 pt-6 border-t border-border">
                        <Button
                          variant="outline"
                          onClick={() => handleLiabilitiesDialogClose(false)}
                          className="h-10 px-4"
                          disabled={isSavingLiabilities}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleLiabilitiesSubmit}
                          className="h-10 px-4 bg-red-600 hover:bg-red-700"
                          disabled={isSavingLiabilities}
                        >
                          {isSavingLiabilities ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            editingLiability ? "Update Liability" : "Add Liabilities"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {liabilities.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {liabilities.map((liability) => (
                        <div key={liability.id} className="py-4 border-b border-border last:border-0">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-medium text-foreground">{liability.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {liability.type}
                                {liability.interestRate && ` • ${liability.interestRate}% APR`}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>Due: {liability.dueDate}</span>
                                {liability.minimumPayment && <span>EMI: ₹{liability.minimumPayment.toLocaleString()}</span>}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right space-y-1">
                                <div className="font-semibold text-red-600">
                                  ₹{liability.amount.toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">Updated {liability.updatedAt}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    disabled={isDeletingLiability === liability.id}
                                  >
                                    {isDeletingLiability === liability.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreVertical className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditLiability(liability)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteLiability(liability.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-6" />

                    <div className="flex items-center justify-between py-2">
                      <span className="text-lg font-semibold text-foreground">Total Liabilities</span>
                      <span className="text-2xl font-bold text-red-600">
                        ₹{totalLiabilities.toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-foreground">No liabilities yet</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Track your debts and loans to get a complete picture of your financial health. Add home loans, credit cards, and other liabilities.
                      </p>
                    </div>
                    <Button
                      onClick={() => setLiabilitiesOpen(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Your First Liability
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PPF Balance Section with Edit/Delete */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">PPF Balance</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your Public Provident Fund and retirement savings
                      </p>
                    </div>
                  </div>
                  <Dialog open={ppfOpen} onOpenChange={handlePpfDialogClose}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add PPF Balance
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader className="space-y-3 pb-6">
                        <DialogTitle className="text-xl">Update PPF Balance</DialogTitle>
                        <DialogDescription>
                          Enter your current PPF balance and contribution details.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="ppf-total" className="text-sm font-medium">
                            Total PPF Balance (₹)
                          </Label>
                          <Input
                            id="ppf-total"
                            type="number"
                            placeholder="1250000"
                            value={newPpf.totalBalance}
                            onChange={(e) => setNewPpf({ ...newPpf, totalBalance: e.target.value })}
                            className="h-10"
                            disabled={isSavingPpf}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ppf-annual" className="text-sm font-medium">
                            Annual Contribution (₹)
                          </Label>
                          <Input
                            id="ppf-annual"
                            type="number"
                            placeholder="150000"
                            value={newPpf.annualContribution}
                            onChange={(e) => setNewPpf({ ...newPpf, annualContribution: e.target.value })}
                            className="h-10"
                            disabled={isSavingPpf}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ppf-maturity" className="text-sm font-medium">
                            Maturity Amount (₹)
                          </Label>
                          <Input
                            id="ppf-maturity"
                            type="number"
                            placeholder="3500000"
                            value={newPpf.maturityAmount}
                            onChange={(e) => setNewPpf({ ...newPpf, maturityAmount: e.target.value })}
                            className="h-10"
                            disabled={isSavingPpf}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ppf-interest" className="text-sm font-medium">
                            Interest Rate (%)
                          </Label>
                          <Input
                            id="ppf-interest"
                            type="number"
                            step="0.1"
                            placeholder="7.1"
                            value={newPpf.interestRate}
                            onChange={(e) => setNewPpf({ ...newPpf, interestRate: e.target.value })}
                            className="h-10"
                            disabled={isSavingPpf}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 pt-6 border-t border-border">
                        <Button
                          variant="outline"
                          onClick={() => handlePpfDialogClose(false)}
                          className="h-10 px-4"
                          disabled={isSavingPpf}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handlePpfUpdate}
                          className="h-10 px-4 bg-blue-600 hover:bg-blue-700"
                          disabled={isSavingPpf}
                        >
                          {isSavingPpf ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Update PPF"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {ppfBalance.totalBalance !== null ? (
                  <div className="space-y-6">
                    <div className="text-center py-6 bg-blue-50 rounded-lg relative">
                      <div className="absolute top-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleEditPpf}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={handleDeletePpf}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="text-3xl font-bold text-foreground mb-2">
                        ₹{ppfBalance.totalBalance.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Total PPF Balance</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {ppfBalance.annualContribution && (
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-xl font-bold text-green-700 mb-1">
                            ₹{ppfBalance.annualContribution.toLocaleString()}
                          </div>
                          <p className="text-sm text-muted-foreground">Annual Contribution</p>
                        </div>
                      )}

                      {ppfBalance.maturityAmount && (
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-xl font-bold text-blue-700 mb-1">
                            ₹{ppfBalance.maturityAmount.toLocaleString()}
                          </div>
                          <p className="text-sm text-muted-foreground">Maturity Amount</p>
                        </div>
                      )}
                    </div>

                    {ppfBalance.interestRate && (
                      <div className="flex items-center justify-between py-3 border-t border-border">
                        <span className="text-sm font-medium text-foreground">Interest Rate</span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {ppfBalance.interestRate}%
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Shield className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-foreground">No PPF data yet</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Track your Public Provident Fund balance and contributions for tax savings and retirement planning.
                      </p>
                    </div>
                    <Button
                      onClick={() => setPpfOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add PPF Balance
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Investments Section with Edit/Delete */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">Investments</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your investment portfolio performance
                      </p>
                    </div>
                  </div>
                  <Dialog open={investmentsOpen} onOpenChange={handleInvestmentsDialogClose}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Investment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader className="space-y-3 pb-6">
                        <DialogTitle className="text-xl">
                          {editingInvestment ? "Edit Investment" : "Add New Investments"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingInvestment
                            ? "Update the investment details below."
                            : "Add one or more investments to track their performance. You can add multiple investments at once."
                          }
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {newInvestments.map((investment, index) => (
                          <div key={index} className="rounded-lg border border-border p-6 space-y-4 bg-card">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-foreground">Investment {index + 1}</h4>
                              {newInvestments.length > 1 && !editingInvestment && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeInvestmentField(index)}
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`investment-name-${index}`} className="text-sm font-medium">
                                  Investment Name
                                </Label>
                                <Input
                                  id={`investment-name-${index}`}
                                  placeholder="e.g., Reliance Industries"
                                  value={investment.name}
                                  onChange={(e) => updateInvestmentField(index, 'name', e.target.value)}
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`investment-type-${index}`} className="text-sm font-medium">
                                  Investment Type
                                </Label>
                                <Select
                                  value={investment.type}
                                  onValueChange={(value) => updateInvestmentField(index, 'type', value)}
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {investmentTypes.map((type) => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`investment-shares-${index}`} className="text-sm font-medium">
                                  Shares/Units
                                </Label>
                                <Input
                                  id={`investment-shares-${index}`}
                                  type="number"
                                  placeholder="100"
                                  value={investment.shares}
                                  onChange={(e) => updateInvestmentField(index, 'shares', e.target.value)}
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`investment-current-${index}`} className="text-sm font-medium">
                                  Current Price (₹)
                                </Label>
                                <Input
                                  id={`investment-current-${index}`}
                                  type="number"
                                  step="0.01"
                                  placeholder="2850.50"
                                  value={investment.currentPrice}
                                  onChange={(e) => updateInvestmentField(index, 'currentPrice', e.target.value)}
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`investment-purchase-${index}`} className="text-sm font-medium">
                                  Purchase Price (₹)
                                </Label>
                                <Input
                                  id={`investment-purchase-${index}`}
                                  type="number"
                                  step="0.01"
                                  placeholder="2500.00"
                                  value={investment.purchasePrice}
                                  onChange={(e) => updateInvestmentField(index, 'purchasePrice', e.target.value)}
                                  className="h-10"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {!editingInvestment && (
                          <Button
                            variant="outline"
                            onClick={addNewInvestmentField}
                            className="w-full h-12 border-dashed border-purple-200 text-purple-600 hover:bg-purple-50"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Investment
                          </Button>
                        )}
                      </div>
                      <div className="flex justify-end space-x-3 pt-6 border-t border-border">
                        <Button
                          variant="outline"
                          onClick={() => handleInvestmentsDialogClose(false)}
                          className="h-10 px-4"
                          disabled={isSavingInvestments}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleInvestmentsSubmit}
                          className="h-10 px-4 bg-purple-600 hover:bg-purple-700"
                          disabled={isSavingInvestments}
                        >
                          {isSavingInvestments ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            editingInvestment ? "Update Investment" : "Add Investments"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {investments.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {investments.map((investment) => (
                        <div key={investment.id} className="py-4 border-b border-border last:border-0">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-medium text-foreground">{investment.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {investment.type} • {investment.shares} shares
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Current: ₹{investment.currentPrice.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right space-y-1">
                                <div className="font-semibold text-foreground">
                                  ₹{investment.totalValue.toFixed(2)}
                                </div>
                                <div className={`text-sm font-medium ${investment.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                  {investment.gainLoss >= 0 ? '+' : ''}
                                  {investment.gainLossPercentage.toFixed(2)}%
                                </div>
                                <p className="text-xs text-muted-foreground">Updated {investment.updatedAt}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    disabled={isDeletingInvestment === investment.id}
                                  >
                                    {isDeletingInvestment === investment.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreVertical className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditInvestment(investment)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteInvestment(investment.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-6" />

                    <div className="flex items-center justify-between py-2">
                      <span className="text-lg font-semibold text-foreground">Portfolio Value</span>
                      <span className="text-2xl font-bold text-purple-600">
                        ₹{totalInvestmentValue.toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-foreground">No investments yet</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Start tracking your investment portfolio performance. Add stocks, mutual funds, SIPs, and other investments.
                      </p>
                    </div>
                    <Button
                      onClick={() => setInvestmentsOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Your First Investment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab Content */}
          <TabsContent value="analytics" className="space-y-6">
            <FinancialAnalytics
              netWorth={netWorth}
              monthlyIncome={monthlyIncome}
              creditScore={creditScore}
              assets={assets.map(asset => ({
                ...asset,
                id: typeof asset.id === "string" ? Number(asset.id) : asset.id
              }))}
              liabilities={liabilities as any}
              investments={investments.map(inv => ({
                ...inv,
                id: typeof inv.id === "string" ? Number(inv.id) : inv.id
              }))}
              epfBalance={{
                totalBalance: ppfBalance.totalBalance,
                employeeContribution: ppfBalance.annualContribution,
                employerContribution: ppfBalance.maturityAmount,
                dividendRate: ppfBalance.interestRate
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}