import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CategorySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export function CategorySelector({ 
  open, 
  onOpenChange, 
  categories, 
  selectedCategories, 
  onCategoriesChange 
}: CategorySelectorProps) {
  const [tempSelection, setTempSelection] = useState<string[]>(selectedCategories);

  // Update temp selection when selectedCategories prop changes
  useEffect(() => {
    setTempSelection(selectedCategories);
  }, [selectedCategories]);

  const getCategoryColors = (category: string, index: number) => {
    // Use specific color mapping for each category
    let colorIndex;
    switch(category) {
      case 'Körperliche Intimität':
        colorIndex = 1; // Red
        break;
      case 'Emotionale Intimität':
        colorIndex = 2; // Blue
        break;
      case 'Geistige Intimität':
        colorIndex = 4; // Rust
        break;
      case 'Kreative Intimität':
        colorIndex = 3; // Pink
        break;
      case 'Spielerische Intimität':
        colorIndex = 6; // Yellow
        break;
      case 'Spirituelle Intimität':
        colorIndex = 7; // Mint
        break;
      case 'Alltagsintimität':
        colorIndex = 5; // Purple
        break;
      case 'Gemeinsame Abenteuer':
        colorIndex = 8; // Green
        break;
      default:
        colorIndex = (index % 8) + 1;
    }
    return `hsl(var(--quiz-category${colorIndex}-bg))`;
  };

  const handleCategoryToggle = (category: string) => {
    setTempSelection(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleApply = () => {
    onCategoriesChange(tempSelection);
    onOpenChange(false);
  };

  const handleClose = () => {
    onCategoriesChange(tempSelection); // Apply changes when closing
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md mx-auto bg-background border-0 p-0 overflow-hidden [&>button]:hidden">
        <DialogDescription className="sr-only">
          Wählen Sie die Kategorien aus, die Sie sehen möchten
        </DialogDescription>
        <div className="flex flex-col w-full bg-background overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-4 pb-2 bg-background">
            <DialogHeader>
              <DialogTitle className="text-white font-normal" style={{ fontSize: '12px' }}>
                Kategorien wählen
              </DialogTitle>
            </DialogHeader>
            
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <X className="h-6 w-6" strokeWidth={1} />
            </button>
          </div>

          {/* Categories List */}
          <ScrollArea className="h-96">
            <div className="px-6 pt-2 space-y-2 pb-6">
              {categories.map((category, index) => {
              const isSelected = tempSelection.includes(category);
              const borderColor = getCategoryColors(category, index);
              
              return (
                <div 
                  key={category}
                  className="flex items-center justify-between cursor-pointer rounded-full"
                  style={{ 
                    backgroundColor: borderColor,
                    paddingLeft: '32px',
                    paddingRight: '8px',
                    paddingTop: '8px',
                    paddingBottom: '8px'
                  }}
                  onClick={() => handleCategoryToggle(category)}
                >
                  <span className="text-black font-normal tracking-wide" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
                    {category}
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <div
                      className="relative cursor-pointer"
                      onClick={() => {
                        const newCategories = isSelected 
                          ? tempSelection.filter(c => c !== category)
                          : [...tempSelection, category];
                        setTempSelection(newCategories);
                      }}
                    >
                      <div
                        className={`w-8 h-8 border border-black flex items-center justify-center rounded-full ${isSelected ? 'bg-black' : 'bg-transparent'}`}
                        style={{ 
                          width: '32px', 
                          height: '32px'
                        }}
                      >
                        {isSelected && (
                          <Check 
                            className="text-white" 
                            style={{ width: '20px', height: '20px' }}
                            strokeWidth={1}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}