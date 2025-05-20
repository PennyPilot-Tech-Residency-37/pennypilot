// budget types
export interface BudgetItem {
    name: string;
    amount: string;
  }
  
  export interface BudgetData {
    income: { name: string; amount: string }[];
    expenses: { name: string; amount: string }[];
    savings: { name: string; amount: string }[];
  }

export interface Budget {
  id?: string;
  name: string;
  data: BudgetData;
  createdAt?: string;
}

// goal types
type Goal = {
  id: number;
  name: string;
  completed: boolean;
};