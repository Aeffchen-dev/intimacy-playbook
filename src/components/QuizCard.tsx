import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Question {
  question: string;
  category: string;
  depth?: 'light' | 'deep';
}

interface QuizCardProps {
  question: Question;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  animationClass?: string;
  categoryIndex?: number;
}

export function QuizCard({ question, onSwipeLeft, onSwipeRight, animationClass = '', categoryIndex = 0 }: QuizCardProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [mouseStart, setMouseStart] = useState<number | null>(null);
  const [mouseEnd, setMouseEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processedText, setProcessedText] = useState<JSX.Element[]>([]);
  
  const textRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  // Process text to handle long words individually and preserve line breaks
  useEffect(() => {
    const processText = () => {
      if (!containerRef.current) return;

      // Normalize text by collapsing any sequence of line breaks into single line breaks
      const normalizedText = question.question
        .replace(/[\r\n]+/g, '\n')  // Convert all line break types to single \n
        .replace(/\n\s*\n+/g, '\n') // Collapse multiple line breaks with optional whitespace
        .replace(/\n{2,}/g, '\n')   // Ensure no more than 1 consecutive line break
        .trim();
      const lines = normalizedText.split('\n');
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      
      // Create temporary element to measure word width with exact same styles
      const tempElement = document.createElement('span');
      tempElement.style.cssText = `
        position: absolute;
        visibility: hidden;
        white-space: nowrap;
        font-size: 4rem;
        font-family: Kokoro, serif;
        font-weight: bold;
        font-style: italic;
        padding: 0;
        margin: 0;
        border: 0;
      `;
      
      // Add to same container to inherit styles
      containerRef.current.appendChild(tempElement);

      const processedLines = lines.map((line, lineIndex) => {
        const words = line.split(' ');
        
        const processedWords = words.map((word, wordIndex) => {
          tempElement.textContent = word;
          const wordWidth = tempElement.getBoundingClientRect().width;
          
          // Only apply hyphenation if word is actually wider than available space
          // Use full container width minus some padding buffer
          const needsHyphenation = wordWidth > (containerWidth - 20);
          
          return (
            <span 
              key={`${lineIndex}-${wordIndex}`}
              style={{
                hyphens: needsHyphenation ? 'auto' : 'none',
                overflowWrap: needsHyphenation ? 'break-word' : 'normal',
                wordBreak: 'normal'
              }}
              lang="de"
            >
              {word}
              {wordIndex < words.length - 1 && ' '}
            </span>
          );
        });

        return (
          <div key={lineIndex}>
            {processedWords}
            {lineIndex < lines.length - 1 && <br />}
          </div>
        );
      });

      containerRef.current.removeChild(tempElement);
      setProcessedText(processedLines);
    };

    const timeoutId = setTimeout(processText, 50);
    window.addEventListener('resize', processText);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', processText);
    };
  }, [question.question]);

  // Get category-specific colors using specific category mapping
  const getCategoryColors = (categoryIndex: number) => {
    // Use specific color mapping for each category based on the actual category name
    let colorIndex;
    switch(question.category) {
      case 'Körperliche Intimität':
        colorIndex = 1; // Cyan
        break;
      case 'Emotionale Intimität':
        colorIndex = 2; // Teal
        break;
      case 'Geistige Intimität':
        colorIndex = 4; // Golden
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
        colorIndex = 8; // Blue
        break;
      default:
        colorIndex = (categoryIndex % 8) + 1;
    }
    
    // CSS custom properties for the colors with proper contrast ratios
    const colorVars = {
      1: { bg: 'hsl(var(--quiz-category1-bg))', text: 'hsl(var(--quiz-category1-text))', pillBg: 'hsl(180 85% 50%)' }, // Darker for Körperliche Intimität
      2: { bg: 'hsl(var(--quiz-category2-bg))', text: 'hsl(var(--quiz-category2-text))', pillBg: 'hsl(186 70% 60%)' }, // 10% darker than 70%
      3: { bg: 'hsl(var(--quiz-category3-bg))', text: 'hsl(var(--quiz-category3-text))', pillBg: 'hsl(320 60% 70%)' }, // 10% darker than 80%
      4: { bg: 'hsl(var(--quiz-category4-bg))', text: 'hsl(var(--quiz-category4-text))', pillBg: 'hsl(45 85% 65%)' }, // 10% darker than 75%
      5: { bg: 'hsl(var(--quiz-category5-bg))', text: 'hsl(var(--quiz-category5-text))', pillBg: 'hsl(270 65% 65%)' }, // 10% darker than 75%
      6: { bg: 'hsl(var(--quiz-category6-bg))', text: 'hsl(var(--quiz-category6-text))', pillBg: 'hsl(55 85% 65%)' }, // 5% darker for Spielerische Intimität
      7: { bg: 'hsl(var(--quiz-category7-bg))', text: 'hsl(var(--quiz-category7-text))', pillBg: 'hsl(160 55% 65%)' }, // 10% darker than 75%
      8: { bg: 'hsl(var(--quiz-category8-bg))', text: 'hsl(var(--quiz-category8-text))', pillBg: 'hsl(200 65% 60%)' }, // 10% darker than 70%
    };
    
    return colorVars[colorIndex as keyof typeof colorVars] || colorVars[1];
  };

  const categoryColors = getCategoryColors(categoryIndex);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onSwipeLeft();
    } else if (isRightSwipe) {
      onSwipeRight();
    }
  };

  // Mouse drag handlers for desktop
  const onMouseDown = (e: React.MouseEvent) => {
    setMouseEnd(null);
    setMouseStart(e.clientX);
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setMouseEnd(e.clientX);
  };

  const onMouseUp = () => {
    if (!isDragging || !mouseStart || !mouseEnd) {
      setIsDragging(false);
      return;
    }
    
    const distance = mouseStart - mouseEnd;
    const isLeftDrag = distance > minSwipeDistance;
    const isRightDrag = distance < -minSwipeDistance;

    if (isLeftDrag) {
      onSwipeLeft();
    } else if (isRightDrag) {
      onSwipeRight();
    }
    
    setIsDragging(false);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className={`relative w-full max-w-[500px] mx-auto rounded-[2rem] shadow-card overflow-hidden select-none max-h-full ${animationClass}`}
      style={{
        height: '100%',
        maxHeight: '100%',
        backgroundColor: question.category.toLowerCase() !== 'intro' ? categoryColors.bg : 'hsl(var(--card-background))',
        color: question.category.toLowerCase() !== 'intro' ? categoryColors.text : 'hsl(var(--foreground))'
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
      <div className={`h-full flex flex-col justify-start ${question.category.toLowerCase() === 'intro' ? 'p-8' : 'p-8 lg:p-10'}`}>
        
        {/* Category Pill - Only for non-intro slides */}
        {question.category.toLowerCase() !== 'intro' && (
          <div className="mb-4">
            <div 
              className="px-4 py-2 rounded-full font-medium inline-block"
              style={{
                backgroundColor: categoryColors.pillBg,
                color: categoryColors.text,
                fontSize: '12px'
              }}
            >
              {question.category}
            </div>
          </div>
        )}

        <div ref={containerRef} className={`flex-1 flex w-full ${question.category.toLowerCase() === 'intro' ? 'items-center justify-start text-left' : 'items-start justify-start text-left'}`}>
          <h1 
            ref={textRef}
            className={`font-normal leading-tight w-full ${question.category.toLowerCase() === 'intro' ? 'text-base md:text-lg lg:text-xl max-w-md' : 'text-3xl md:text-4xl lg:text-5xl max-w-full'}`}
            style={{ 
              fontFamily: 'Kokoro, serif',
              fontWeight: 'bold',
              fontStyle: 'italic',
              color: question.category.toLowerCase() !== 'intro' ? categoryColors.text : 'hsl(var(--foreground))'
            }}
          >
            {processedText.length > 0 ? processedText : question.question}
          </h1>
        </div>

        {/* Navigation hint at bottom - only for intro slides */}
        {question.category.toLowerCase() === 'intro' && (
          <div className="text-center">
            <p className="text-xs opacity-60">
              Swipe um weiter zu navigieren
            </p>
          </div>
        )}

      </div>

    </div>
  );
}