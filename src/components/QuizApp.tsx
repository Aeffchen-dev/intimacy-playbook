import { useState, useEffect } from 'react';
import { QuizCard } from './QuizCard';
import { CategorySelector } from './CategorySelector';
import { IntroSlide } from './IntroSlide';
import { Switch } from './ui/switch';

interface Question {
  question: string;
  category: string;
  depth: 'light' | 'deep';
  type?: string; // "Frage" or "Aktion"
}

interface SlideItem {
  type: 'intro' | 'question';
  question?: Question;
}

// Smart shuffle algorithm to distribute categories more evenly
const smartShuffle = (questions: Question[]): Question[] => {
  // Group questions by category
  const categorizedQuestions: { [category: string]: Question[] } = {};
  questions.forEach(q => {
    if (!categorizedQuestions[q.category]) {
      categorizedQuestions[q.category] = [];
    }
    categorizedQuestions[q.category].push(q);
  });

  // Shuffle questions within each category
  Object.keys(categorizedQuestions).forEach(category => {
    categorizedQuestions[category] = categorizedQuestions[category].sort(() => Math.random() - 0.5);
  });

  const categories = Object.keys(categorizedQuestions);
  const result: Question[] = [];
  const categoryCounters: { [category: string]: number } = {};
  
  // Initialize counters
  categories.forEach(cat => categoryCounters[cat] = 0);

  // Distribute questions more evenly
  while (result.length < questions.length) {
    // Shuffle categories for each round
    const shuffledCategories = [...categories].sort(() => Math.random() - 0.5);
    
    for (const category of shuffledCategories) {
      const categoryQuestions = categorizedQuestions[category];
      const counter = categoryCounters[category];
      
      if (counter < categoryQuestions.length) {
        result.push(categoryQuestions[counter]);
        categoryCounters[category]++;
        
        // Break if we've added all questions
        if (result.length >= questions.length) break;
      }
    }
  }

  return result;
};

export function QuizApp() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [introSlide, setIntroSlide] = useState<Question | null>(null);
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorySelectorOpen, setCategorySelectorOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isMixedMode, setIsMixedMode] = useState(true);
  const [hasToggleBeenChanged, setHasToggleBeenChanged] = useState(false);
  const [categoryColorMap, setCategoryColorMap] = useState<{ [category: string]: number }>({});
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Add drag handlers
  useEffect(() => {
    const handleStart = (clientX: number, clientY: number) => {
      setIsDragging(true);
      setDragStart({ x: clientX, y: clientY });
      setDragOffset({ x: 0, y: 0 });
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      
      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;
      
      setDragOffset({ x: deltaX, y: deltaY });
    };

    const handleEnd = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      
      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;
      const threshold = 200;
      
      // Any direction drag triggers next slide if threshold is met
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        nextQuestion();
      }
      
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: MouseEvent) => {
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      handleEnd(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      handleEnd(touch.clientX, touch.clientY);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStart]);

  const fetchQuestions = async () => {
    try {
      let csvText = '';
      
      try {
        // Use the new Google Sheets URL with cache busting
        const spreadsheetId = '1-BHUX8Zm4C2tACRJugpF_fj8TzBXnGGGUYQV3ggfKYM';
        const timestamp = new Date().getTime();
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0&cachebust=${timestamp}`;
        
        const response = await fetch(csvUrl, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch spreadsheet data');
        }
        
        csvText = await response.text();
      } catch (sheetsError) {
        console.log('Google Sheets failed, trying local CSV file:', sheetsError);
        // Fallback to local CSV file
        const localResponse = await fetch('/quiz_questions.csv');
        if (!localResponse.ok) {
          throw new Error('Failed to fetch local CSV data');
        }
        csvText = await localResponse.text();
      }
      
      // Parse CSV data - handle multi-line quoted fields
      const questions: Question[] = [];
      let introContent: Question | null = null;
      
      // Parse CSV properly to handle multi-line quoted fields
      const parseCSV = (csvText: string): string[][] => {
        const result: string[][] = [];
        let current = '';
        let inQuotes = false;
        let row: string[] = [];
        
        for (let i = 0; i < csvText.length; i++) {
          const char = csvText[i];
          
          if (char === '"') {
            if (inQuotes && csvText[i + 1] === '"') {
              // Escaped quote
              current += '"';
              i++; // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // Field separator outside quotes
            row.push(current.trim());
            current = '';
          } else if ((char === '\n' || char === '\r') && !inQuotes) {
            // Row separator outside quotes
            if (current.trim() || row.length > 0) {
              row.push(current.trim());
              if (row.some(field => field.length > 0)) {
                result.push(row);
              }
              row = [];
              current = '';
            }
          } else {
            // Regular character or line break inside quotes
            current += char;
          }
        }
        
        // Add the last field and row
        if (current.trim() || row.length > 0) {
          row.push(current.trim());
          if (row.some(field => field.length > 0)) {
            result.push(row);
          }
        }
        
        return result;
      };
      
      const rows = parseCSV(csvText);
      
      for (let i = 0; i < rows.length; i++) {
        const values = rows[i];
        
        // Skip header row
        if (i === 0 && (values[0]?.toLowerCase().includes('categor') || values[1]?.toLowerCase().includes('question'))) {
          continue;
        }
        
        if (values.length >= 2 && values[0] && values[1]) {
          const question: Question = {
            category: values[0],
            question: values[1],
            depth: values[0].toLowerCase() === 'aktion' ? 'deep' : 'light',
            type: values[2] || 'Frage' // Default to "Frage" if third column is empty
          };
          
          // Handle intro content
          if (question.category.toLowerCase() === 'intro') {
            introContent = question;
          } else {
            questions.push(question);
          }
        }
      }
      
      if (questions.length > 0) {
        // Better shuffling algorithm to distribute categories evenly
        const shuffledQuestions = smartShuffle(questions);
        
        setAllQuestions(shuffledQuestions);
        setIntroSlide(introContent);
        
        // Extract unique categories (exclude 'Intro') and assign specific colors
        const categories = Array.from(new Set(questions.map(q => q.category)))
          .filter(cat => cat.toLowerCase() !== 'intro');
        
        // Specific color mapping for each category
        const colorMap: { [category: string]: number } = {};
        categories.forEach((category) => {
          switch(category) {
            case 'Körperliche Intimität':
              colorMap[category] = 0; // Now cyan (category1)
              break;
            case 'Emotionale Intimität':
              colorMap[category] = 1; // Red (category2)
              break;
            case 'Geistige Intimität':
              colorMap[category] = 2; // Now blue (category3)
              break;
            case 'Kreative Intimität':
              colorMap[category] = 3; // Pink (category4)
              break;
            case 'Spielerische Intimität':
              colorMap[category] = 4; // Yellow (category5)
              break;
            case 'Spirituelle Intimität':
              colorMap[category] = 5; // Mint green (category6)
              break;
            case 'Alltagsintimität':
              colorMap[category] = 5; // Mint green (category6)
              break;
            case 'Gemeinsame Abenteuer':
              colorMap[category] = 6; // Orange (category7)
              break;
            default:
              colorMap[category] = categories.indexOf(category) % 7;
          }
        });
        setCategoryColorMap(colorMap);
        setAvailableCategories(categories);
        setSelectedCategories(categories); // Start with all categories selected
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevQuestion();
    } else if (e.key === 'ArrowRight') {
      nextQuestion();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  // Filter and order slides based on categories and mode
  useEffect(() => {
    // Filter by categories
    let filteredQuestions = allQuestions.filter(q => 
      selectedCategories.includes(q.category)
    );
    
    // Filter by type based on toggle - when toggle is off (isMixedMode=false), show only "Frage" content
    if (!isMixedMode) {
      filteredQuestions = filteredQuestions.filter(q => q.type === 'Frage');
    }
    
    setQuestions(filteredQuestions);
    
    const slides: SlideItem[] = [];
    
    // Shuffle questions when toggle state changes
    const shuffledQuestions = smartShuffle([...filteredQuestions]);
    
    // Add question slides
    shuffledQuestions.forEach(q => {
      slides.push({ type: 'question', question: q });
    });
    
    setSlides(slides);
    setCurrentIndex(0); // Reset to first slide when filtering/mode changes
  }, [selectedCategories, allQuestions, availableCategories.length, isMixedMode, hasToggleBeenChanged]);

  // Clamp current index whenever slides length changes to prevent out-of-bounds access
  useEffect(() => {
    setCurrentIndex((i) => (slides.length ? Math.min(i, slides.length - 1) : 0));
  }, [slides.length]);

  const handleCategoriesChange = (categories: string[]) => {
    setSelectedCategories(categories);
  };

  const hasSlides = slides.length > 0;
  const safeIndex = hasSlides ? Math.min(currentIndex, slides.length - 1) : 0;
  const safeSlide = hasSlides ? slides[safeIndex] : undefined;

  return (
    <div className="min-h-[100svh] h-[100svh] bg-background overflow-hidden flex flex-col" style={{ height: '100svh' }}>
      {/* App Header with controls */}
      <div className="bg-black mt-4 flex items-center justify-between w-full px-4" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
        <div className="text-white font-normal text-xs">
          Intimacy Playbook
        </div>
        <button 
          onClick={() => setCategorySelectorOpen(true)}
          className="text-white font-normal text-xs flex items-center"
        >
          Kategorien wählen
        </button>
      </div>

      {/* Main Quiz Container */}
      <div className="flex-1 flex flex-col px-4 overflow-hidden mt-4 gap-4" style={{ minHeight: 0 }}>
        <div className="flex-1 flex items-stretch justify-center min-h-0 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full text-white text-xl">Lade Fragen...</div>
          ) : hasSlides ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Render stack of cards */}
              {slides.slice(safeIndex, safeIndex + 4).map((slide, stackIndex) => {
                const actualIndex = safeIndex + stackIndex;
                const isTopCard = stackIndex === 0;
                
                // Calculate transform based on drag for top card
                const dragTransform = isTopCard && isDragging 
                  ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`
                  : '';
                
                return (
                  <div
                    key={`${actualIndex}-${slide.question?.question.slice(0, 20)}`}
                    className={`absolute inset-0 transition-all duration-200 ${
                      isTopCard && !isDragging ? 'cursor-grab' : ''
                    } ${isTopCard && isDragging ? 'cursor-grabbing' : ''}`}
                    style={{
                      zIndex: 10 - stackIndex,
                      transform: `
                        ${dragTransform}
                        translateY(${stackIndex * 8}px) 
                        translateX(${stackIndex * 4}px) 
                        scale(${1 - stackIndex * 0.03})
                      `,
                      opacity: 1 - stackIndex * 0.15,
                      pointerEvents: isTopCard ? 'auto' : 'none',
                    }}
                  >
                    <QuizCard
                      question={slide.question!}
                      onSwipeLeft={() => {}}
                      onSwipeRight={() => {}}
                      animationClass=""
                      categoryIndex={categoryColorMap[slide.question!.category] || 0}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-white text-xl">Keine Fragen verfügbar</div>
          )}
        </div>
        
        {/* Toggle centered below the card */}
        <div className="flex items-center justify-center gap-2 pb-4">
          <span className="text-white font-normal text-xs">question mode</span>
          <Switch 
            checked={isMixedMode}
            onCheckedChange={(checked) => {
              setIsMixedMode(checked);
              setHasToggleBeenChanged(true);
            }}
            className="w-[46px] data-[state=checked]:bg-transparent data-[state=unchecked]:bg-transparent data-[state=checked]:border-white data-[state=unchecked]:border-white border-[1px] [&>span]:bg-white [&>span]:m-0.5"
          />
          <span className="text-white font-normal text-xs">action mode</span>
        </div>
      </div>
      
      <CategorySelector
        open={categorySelectorOpen}
        onOpenChange={setCategorySelectorOpen}
        categories={availableCategories}
        selectedCategories={selectedCategories}
        onCategoriesChange={handleCategoriesChange}
      />
    </div>
  );
}