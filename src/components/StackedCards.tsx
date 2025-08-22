import { useState, useRef } from 'react';
import { QuizCard } from './QuizCard';

interface Question {
  question: string;
  category: string;
  depth?: 'light' | 'deep';
}

interface SlideItem {
  type: 'intro' | 'question';
  question?: Question;
}

interface StackedCardsProps {
  slides: SlideItem[];
  onCardRemoved: () => void;
  categoryColorMap: Record<string, number>;
}

export function StackedCards({ slides, onCardRemoved, categoryColorMap }: StackedCardsProps) {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const topCardRef = useRef<HTMLDivElement>(null);

  const minDragDistance = 100; // Minimum distance to remove card

  // Handle mouse/touch start
  const handlePointerStart = (clientX: number, clientY: number) => {
    setDragState({
      isDragging: true,
      startX: clientX,
      startY: clientY,
      currentX: 0,
      currentY: 0,
    });
  };

  // Handle mouse/touch move
  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!dragState.isDragging) return;

    const deltaX = clientX - dragState.startX;
    const deltaY = clientY - dragState.startY;

    setDragState(prev => ({
      ...prev,
      currentX: deltaX,
      currentY: deltaY,
    }));
  };

  // Handle mouse/touch end
  const handlePointerEnd = () => {
    if (!dragState.isDragging) return;

    const distance = Math.sqrt(
      dragState.currentX ** 2 + dragState.currentY ** 2
    );

    if (distance > minDragDistance) {
      // Card dragged far enough, remove it
      onCardRemoved();
    }

    // Reset drag state
    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  };

  // Mouse event handlers
  const onMouseDown = (e: React.MouseEvent) => {
    handlePointerStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handlePointerMove(e.clientX, e.clientY);
  };

  const onMouseUp = () => {
    handlePointerEnd();
  };

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerEnd();
  };

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white text-xl">
        Keine weiteren Karten
      </div>
    );
  }

  // Filter out slides without questions
  const validSlides = slides.filter(slide => slide.question);

  if (validSlides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white text-xl">
        Keine weiteren Karten
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
      onMouseMove={dragState.isDragging ? onMouseMove : undefined}
      onMouseUp={dragState.isDragging ? onMouseUp : undefined}
      onMouseLeave={dragState.isDragging ? onMouseUp : undefined}
    >
      {/* Render up to 3 cards for the stack effect */}
      {validSlides.slice(0, 3).map((slide, index) => {
        const isTopCard = index === 0;
        const zIndex = validSlides.length - index;
        
        // Calculate transform for stacking effect
        let transform = '';
        let opacity = 1;
        
        if (isTopCard && dragState.isDragging) {
          // Apply drag transform to top card
          const rotation = dragState.currentX * 0.1; // Slight rotation based on horizontal drag
          transform = `translate(${dragState.currentX}px, ${dragState.currentY}px) rotate(${rotation}deg)`;
          
          // Calculate opacity based on drag distance
          const distance = Math.sqrt(dragState.currentX ** 2 + dragState.currentY ** 2);
          opacity = Math.max(0.3, 1 - (distance / (minDragDistance * 2)));
        } else if (!isTopCard) {
          // Stack effect for cards behind
          const offset = index * 4;
          const scale = 1 - (index * 0.025);
          transform = `translateY(${offset}px) scale(${scale})`;
          opacity = 1 - (index * 0.1); // Subtle opacity reduction for depth
        }

        return (
          <div
            key={`${slide.question!.question}-${index}`}
            ref={isTopCard ? topCardRef : undefined}
            className={`absolute w-full h-full transition-transform duration-200 ease-out ${isTopCard ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{
              zIndex,
              transform: dragState.isDragging && isTopCard ? transform : transform,
              opacity,
              transitionDuration: dragState.isDragging && isTopCard ? '0ms' : '200ms',
              filter: !isTopCard ? 'brightness(0.95)' : 'none', // Slight darkening for depth
            }}
            onMouseDown={isTopCard ? onMouseDown : undefined}
            onTouchStart={isTopCard ? onTouchStart : undefined}
            onTouchMove={isTopCard ? onTouchMove : undefined}
            onTouchEnd={isTopCard ? onTouchEnd : undefined}
          >
            <QuizCard
              question={slide.question!}
              onSwipeLeft={() => {}} // Disable swipe events since we handle dragging differently
              onSwipeRight={() => {}}
              animationClass=""
              categoryIndex={categoryColorMap[slide.question!.category] || 0}
            />
          </div>
        );
      })}
    </div>
  );
}