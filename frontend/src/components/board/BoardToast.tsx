import { Toast } from "@/components/ui/toast";

interface BoardToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function BoardToast({ message, isVisible, onClose }: BoardToastProps) {
  return (
    <Toast 
      message={message}
      isVisible={isVisible}
      onClose={onClose}
    />
  );
}