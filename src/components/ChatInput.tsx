import { useState, useRef, useEffect } from 'react';
import { TextField, IconButton, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import SendIcon from '@mui/icons-material/Send';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const InputContainer = styled(motion(Paper))(({ theme }) => ({
  position: 'fixed',
  bottom: `calc(60px + ${theme.spacing(2)} + env(safe-area-inset-bottom))`,
  left: theme.spacing(2),
  right: theme.spacing(2),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: 24,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  zIndex: 1000,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  flex: 1,
  '& .MuiOutlinedInput-root': {
    borderRadius: 20,
    backgroundColor: theme.palette.background.default,
    '& fieldset': {
      borderColor: 'transparent',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const SendButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  '&.Mui-disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
  },
}));

const ChatInput = ({ onSend, disabled = false, placeholder = 'Type a message...' }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <AnimatePresence>
      <InputContainer
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%', gap: '8px' }}>
          <StyledTextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            variant="outlined"
            size="small"
          />
          <SendButton
            type="submit"
            disabled={!message.trim() || disabled}
            aria-label="send message"
          >
            <SendIcon />
          </SendButton>
        </form>
      </InputContainer>
    </AnimatePresence>
  );
};

export default ChatInput; 