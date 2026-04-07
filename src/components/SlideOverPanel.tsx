import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface SlideOverPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const SlideOverPanel = ({ open, onClose, title, children }: SlideOverPanelProps) => (
  <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <div className="flex items-center justify-between">
          <SheetTitle className="text-primary">{title}</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </SheetHeader>
      <div className="mt-6 space-y-4">{children}</div>
    </SheetContent>
  </Sheet>
);

export default SlideOverPanel;
