import { useState, useRef } from 'react';

interface IntroSlideProps {
  type: 'welcome' | 'description';
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  animationClass?: string;
  onDragStart?: (clientX: number) => void;
  onDragMove?: (clientX: number) => void;
  onDragEnd?: () => void;
  dragOffset?: number;
  isDragging?: boolean;
}

export function IntroSlide({ 
  type, 
  onSwipeLeft, 
  onSwipeRight, 
  animationClass = '',
  onDragStart,
  onDragMove,
  onDragEnd,
  dragOffset = 0,
  isDragging = false
}: IntroSlideProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);
  const [mouseStartY, setMouseStartY] = useState<number | null>(null);
  const [mouseEndX, setMouseEndX] = useState<number | null>(null);
  const [mouseEndY, setMouseEndY] = useState<number | null>(null);
  const [isMousePressed, setIsMousePressed] = useState(false);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (onDragStart) {
      onDragStart(e.touches[0].clientX);
    } else {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (onDragMove) {
      onDragMove(e.touches[0].clientX);
    } else {
      if (touchStartX === null || touchStartY === null) return;
      setTouchEndX(e.touches[0].clientX);
      setTouchEndY(e.touches[0].clientY);
    }
  };

  const onTouchEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    } else {
      if (!touchStartX || !touchStartY || !touchEndX || !touchEndY) return;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Only trigger if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
      }
      
      // Reset
      setTouchStartX(null);
      setTouchStartY(null);
      setTouchEndX(null);
      setTouchEndY(null);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (onDragStart) {
      onDragStart(e.clientX);
    } else {
      setMouseStartX(e.clientX);
      setMouseStartY(e.clientY);
      setIsMousePressed(true);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (onDragMove) {
      onDragMove(e.clientX);
    } else {
      if (!isMousePressed || mouseStartX === null || mouseStartY === null) return;
      setMouseEndX(e.clientX);
      setMouseEndY(e.clientY);
    }
  };

  const onMouseUp = () => {
    if (onDragEnd) {
      onDragEnd();
    } else {
      if (!isMousePressed || !mouseStartX || !mouseStartY || !mouseEndX || !mouseEndY) return;
      
      const deltaX = mouseEndX - mouseStartX;
      const deltaY = mouseEndY - mouseStartY;
      
      // Only trigger if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
      }
      
      // Reset
      setMouseStartX(null);
      setMouseStartY(null);
      setMouseEndX(null);
      setMouseEndY(null);
      setIsMousePressed(false);
    }
  };

  const onMouseLeave = () => {
    if (onDragEnd && isDragging) {
      onDragEnd();
    } else {
      // Reset mouse state when leaving the element
      setMouseStartX(null);
      setMouseStartY(null);
      setMouseEndX(null);
      setMouseEndY(null);
      setIsMousePressed(false);
    }
  };

  return (
    <div 
      className={`relative w-full max-w-[500px] mx-auto bg-[hsl(var(--card-background))] rounded-2xl shadow-card overflow-hidden select-none max-h-full ${animationClass}`}
      style={{
        height: '100%',
        maxHeight: '100%'
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* Left Click Area - Previous */}
      <div 
        className="absolute left-0 top-0 w-20 h-full z-10 cursor-pointer"
        onClick={onSwipeRight}
      />

      {/* Right Click Area - Next */}
      <div 
        className="absolute right-0 top-0 w-20 h-full z-10 cursor-pointer"
        onClick={onSwipeLeft}
      />

      {/* Main Content */}
      <div className="h-full flex flex-col justify-center px-8 relative">
        {type === 'welcome' ? (
          <>
            {/* Main title - vertically and horizontally centered */}
            <div className="flex-1 flex items-center justify-center">
              <h1 
                className="text-3xl md:text-4xl lg:text-4xl font-bold text-foreground text-center leading-tight"
                style={{ fontFamily: 'Kokoro, serif', fontWeight: 'bold', fontStyle: 'italic' }}
              >
                Offene Beziehung: Wie gehen wir das richtig an?
              </h1>
            </div>
            
            {/* Bottom text */}
            <div className="pb-8">
              <p 
                className="text-xs text-foreground text-center"
                style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}
              >
                Swipe um weiter zu navigieren
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Description slide - centered content */}
            <div className="flex-1 flex items-center justify-center">
              <p 
                className="text-foreground text-center leading-relaxed"
                style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}
              >
                In einer monogamen Beziehung herrschen allgemein bekannte universelle Regeln. Wohingegen es für offenen Beziehungen keinen Standard gibt – ihr gestaltet eure Regeln selbst, so wie es zu euch passt. Dieses Kartenspiel unterstützt euch dabei, ins Gespräch zu kommen: über eure Wünsche, Motivation, Ängste, Bedürfnisse und Grenzen. Zwischendurch erhaltet ihr Impulse, die Nähe schaffen und eure Verbindung stärken. So entdeckt ihr Schritt für Schritt, ob sich eine offene Beziehung für euch richtig anfühlt und wie ihr sie gestalten wollt. Die Fragen sind zufällig angeordnet, wenn ihr Thema für Thema vorgehen möchtet könnt ihr die Filterfunktion nutzen. Seid ehrlich zu euch selbst, bleibt euch treu, hört eurem Partner zu und respektiert dessen Meinung, auch wenn sie gegensätzlich ist. Ihr solltet gemeinsam agieren und das tun, was für euch als Team am besten ist.
              </p>
            </div>
            
            {/* Bottom text */}
            <div className="pb-8">
              <p 
                className="text-xs text-foreground text-center"
                style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}
              >
                Swipe um weiter zu navigieren
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}