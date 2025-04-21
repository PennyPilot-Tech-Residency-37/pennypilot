import { Container, Typography, Box } from "@mui/material";
import BudgetGroup from "./BudgetGroup";
import PilotAvatar from "./PilotAvatar";

const BudgetBoard = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",

          minHeight: "calc(100vh - 128px)",
          justifyContent: "center",
          px: { xs: 2, sm: 0 },
        }}
      >
        <PilotAvatar message="Here's your budget!" sx={{width: {md: 450}}}/>
      <Typography variant="h4" gutterBottom>
        Your Budget
      </Typography>
      <BudgetGroup title="Income" />
      <BudgetGroup title="Expenses" />
      <BudgetGroup title="Savings" />
      </Box>
    </Container>
  );
};

export default BudgetBoard;
