import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  alignSelf: 'flex-start',
  backgroundColor: theme.palette.background.paper,
  borderRadius: 16,
  borderBottomLeftRadius: 4,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: -8,
    width: 16,
    height: 16,
    backgroundColor: theme.palette.background.paper,
    clipPath: 'polygon(0 100%, 100% 100%, 100% 0)',
  },
}));

const Dot = styled(motion.div)(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
}));

const ChatLoading = () => {
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const dotVariants = {
    initial: { scale: 0.5, opacity: 0.5 },
    animate: { scale: 1, opacity: 1 },
  };

  const dotTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: 'reverse' as const,
  };

  return (
    <LoadingContainer
      component={motion.div}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Dot
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...dotTransition, delay: 0 }}
      />
      <Dot
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...dotTransition, delay: 0.2 }}
      />
      <Dot
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...dotTransition, delay: 0.4 }}
      />
    </LoadingContainer>
  );
};

export default ChatLoading; 