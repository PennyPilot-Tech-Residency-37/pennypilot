// budget types
export interface BudgetItem {
    name: string;
    amount: string;
  }
  
  export interface BudgetData {
    income: BudgetItem[];
    expenses: BudgetItem[];
    savings: BudgetItem[];
  }
// goal types
type Goal = {
  id: number;
  name: string;
  completed: boolean;
};
