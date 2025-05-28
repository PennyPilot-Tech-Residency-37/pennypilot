import { useState, useEffect} from 'react';
import { Box, Card, Typography, Button } from '@mui/material';
import Confetti from 'react-confetti';
import { useWindowSize } from '@react-hook/window-size';

type GoalInput = {
  id: number;
  name: string;
  amount: number;
  frequency: "daily" | "weekly" | "monthly";
  startDate: Date;
  dueDate: Date;
  stepsCompleted: number[];
  completed: boolean;
};

interface GoalsToolKitProps {
  goal: GoalInput;
  onEditSettings: () => void;
}

const GoalsToolKit: React.FC<GoalsToolKitProps> = ({ goal, onEditSettings }) => {
    const { amount, startDate, dueDate, stepsCompleted } = goal;
  
    const totalSaved = stepsCompleted.reduce((acc, amt) => acc + amt, 0);
    const progress = Math.min((totalSaved / amount) * 100, 100);
    const isComplete = totalSaved >= goal.amount;

    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        const celebrationKey = `goal-${goal.id}-celebrated`;
      
        const hasCelebrated = localStorage.getItem(celebrationKey);
      
        if (isComplete && !hasCelebrated) {
          setShowConfetti(true);
          localStorage.setItem(celebrationKey, "true");
      
          const timeout = setTimeout(() => {
            setShowConfetti(false);
          }, 8000); // Confetti lasts 8 seconds
      
          return () => clearTimeout(timeout);
        }
      }, [isComplete, goal.id]);

  
    const [width, height] = useWindowSize();
  
    const radius = 60;
    const stroke = 10;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
  
    const formattedStart = new Date(startDate).toLocaleDateString();
    const formattedDue = new Date(dueDate).toLocaleDateString();

    return (
        <>
        {showConfetti && <Confetti width={width} height={height} />}
        <Box sx={{ position: 'sticky', top: 100, width: 280, alignSelf: 'flex-start' }}>
          <Card sx={{ p: 3, boxShadow: 3, borderRadius: 3 }}>
            {/* 💹 Circular progress bar */}
            <Box sx={{ position: 'relative', width: 120, height: 120, mx: 'auto', mb: 2 }}>
              <svg height="120" width="120">
                <circle
                  stroke="#e0e0e0"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx="60"
                  cy="60"
                />
                <circle
                  stroke="#1976d2"
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx="60"
                  cy="60"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalSaved)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  saved of {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}
                </Typography>

              </Box>
            </Box>
    
            {/* 📅 Date range */}
            <Box textAlign="center" mb={2}>
              <Typography variant="body1">
                <strong>{formattedStart}</strong> – <strong>{formattedDue}</strong>
              </Typography>
            </Box>
    
            <Box borderTop={1} borderColor="divider" my={2} />
    
            {/* ⚙️ Settings */}
            <Box textAlign="center">
              <Button variant="outlined" size="medium" onClick={onEditSettings} sx={{ borderRadius: 2 }}>
                Goal Settings
              </Button>
            </Box>
          </Card>
        </Box>
        </>
      );
    };

export default GoalsToolKit;
