export interface BudgetItem {
    name: string;
    amount: string;
  }
  
  export interface BudgetData {
    income: BudgetItem[];
    expenses: BudgetItem[];
    savings: BudgetItem[];
  }
  