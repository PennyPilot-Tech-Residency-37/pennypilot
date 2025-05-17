export interface Transaction {
    id: string;
    date: string;
    amount: number;
    description: string;
    category: string;
    account_id: string;
    personal_finance_category?: {
      primary: string;
      detailed: string;
    };
  }
  
  export interface CategorizedTransactions {
    income: Transaction[];
    expenses: Transaction[];
    savings: Transaction[];
  }
  
  function fallbackCategorize(desc: string, amount: number): "Income" | "Savings" | "Expense" {
    const lower = desc.toLowerCase();
    
    if (amount > 0 && (lower.includes("payroll") || lower.includes("deposit") || lower.includes("payment received"))) {
      return "Income";
    }
    if (lower.includes("savings") || lower.includes("transfer") || lower.includes("high yield") || lower.includes("emergency")) {
      return "Savings";
    }
  
    return "Expense";
  }
  
  export function categorizeTransactions(transactions: Transaction[]): CategorizedTransactions {
    const income: Transaction[] = [];
    const expenses: Transaction[] = [];
    const savings: Transaction[] = [];
  
    for (const tx of transactions) {
      const desc = tx.description?.toLowerCase?.() || "";
  
      const primary = tx.personal_finance_category?.primary?.toUpperCase();
  
      let category: "Income" | "Expense" | "Savings";
  
      if (primary === "INCOME") {
        category = "Income";
      } else if (
        primary === "TRANSFER" &&
        (desc.includes("savings") || desc.includes("ally"))
      ) {
        category = "Savings";
      } else if (primary === "EXPENSE") {
        category = "Expense";
      } else {
        category = fallbackCategorize(desc, tx.amount);
      }
  
      tx.category = category;
  
      if (category === "Income") income.push(tx);
      else if (category === "Savings") savings.push(tx);
      else expenses.push(tx);
    }
  
    return { income, expenses, savings };
  }
  
  