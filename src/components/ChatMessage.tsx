import { motion } from 'framer-motion';
import { Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
}

const MessageContainer = styled(motion(Paper))<{ role: 'user' | 'assistant' }>(({ theme, role }) => ({
  maxWidth: '85%',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
  backgroundColor: role === 'user' ? theme.palette.primary.main : theme.palette.background.paper,
  color: role === 'user' ? theme.palette.primary.contrastText : theme.palette.text.primary,
  borderRadius: 16,
  borderBottomRightRadius: role === 'user' ? 4 : 16,
  borderBottomLeftRadius: role === 'user' ? 16 : 4,
  wordBreak: 'break-word',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    [role === 'user' ? 'right' : 'left']: -8,
    width: 16,
    height: 16,
    backgroundColor: role === 'user' ? theme.palette.primary.main : theme.palette.background.paper,
    clipPath: role === 'user' 
      ? 'polygon(0 0, 100% 100%, 100% 0)'
      : 'polygon(0 100%, 100% 100%, 100% 0)',
  },
}));

const MessageText = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  lineHeight: 1.5,
  marginBottom: theme.spacing(0.5),
}));

const MessageTime = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  opacity: 0.7,
  textAlign: 'right',
}));

const ChatMessage = ({ content, role, timestamp }: ChatMessageProps) => {
  return (
    <MessageContainer
      role={role}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <MessageText>{content}</MessageText>
      {timestamp && <MessageTime>{timestamp}</MessageTime>}
    </MessageContainer>
  );
};

export default ChatMessage; 