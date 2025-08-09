import { motion } from "framer-motion";
import { Clock, Users, Star, Heart, Zap } from "lucide-react";

interface WaitlistAnimationProps {
  position: number;
  isLoading?: boolean;
  className?: string;
}

// Bouncing dots animation for loading states
export function LoadingDots({ className = "" }: { className?: string }) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{
            y: [0, -8, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Playful position indicator with animated elements
export function PlayfulPositionIndicator({ position, isLoading, className = "" }: WaitlistAnimationProps) {
  const getPositionIcon = (pos: number) => {
    if (pos <= 3) return Star;
    if (pos <= 10) return Heart;
    return Users;
  };

  const getPositionColor = (pos: number) => {
    if (pos === 1) return "text-yellow-500";
    if (pos <= 3) return "text-orange-500";
    if (pos <= 10) return "text-blue-500";
    return "text-gray-500";
  };

  const getPositionMessage = (pos: number) => {
    if (pos === 1) return "You're next! 🎉";
    if (pos <= 3) return "Almost there!";
    if (pos <= 10) return "Hang tight!";
    return "In the queue";
  };

  const PositionIcon = getPositionIcon(position);

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Animated position badge */}
      <motion.div
        className={`relative flex items-center justify-center w-16 h-16 rounded-full border-4 ${
          position === 1 ? 'border-yellow-400 bg-yellow-50' : 
          position <= 3 ? 'border-orange-400 bg-orange-50' :
          position <= 10 ? 'border-blue-400 bg-blue-50' :
          'border-gray-400 bg-gray-50'
        }`}
        animate={{
          scale: [1, 1.1, 1],
          rotate: position === 1 ? [0, 5, -5, 0] : [0],
        }}
        transition={{
          duration: position === 1 ? 0.8 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Position number */}
        <motion.span
          className={`text-xl font-bold ${getPositionColor(position)}`}
          animate={{
            scale: position === 1 ? [1, 1.2, 1] : [1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {position}
        </motion.span>

        {/* Sparkle effect for position 1 */}
        {position === 1 && (
          <>
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.div
              className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-300 rounded-full"
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.5,
              }}
            />
          </>
        )}
      </motion.div>

      {/* Animated icon */}
      <motion.div
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <PositionIcon className={`w-6 h-6 ${getPositionColor(position)}`} />
      </motion.div>

      {/* Position message */}
      <motion.p
        className="text-sm font-medium text-gray-600"
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {getPositionMessage(position)}
      </motion.p>

      {/* Loading indicator */}
      {isLoading && <LoadingDots className="mt-2" />}
    </div>
  );
}

// Progress queue visualization
export function QueueVisualization({ position, totalInQueue = 15, className = "" }: { position: number; totalInQueue?: number; className?: string }) {
  const queueItems = Array.from({ length: Math.min(totalInQueue, 10) }, (_, i) => i + 1);
  
  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <p className="text-sm text-gray-600 font-medium">Queue Position</p>
      
      <div className="flex items-center space-x-1 overflow-x-auto max-w-full">
        {queueItems.map((pos) => (
          <motion.div
            key={pos}
            className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
              pos === position
                ? 'bg-primary text-white border-primary shadow-lg'
                : pos < position
                ? 'bg-green-100 text-green-600 border-green-300'
                : 'bg-gray-100 text-gray-400 border-gray-300'
            }`}
            animate={{
              scale: pos === position ? [1, 1.2, 1] : [1],
              y: pos === position ? [0, -2, 0] : [0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {pos === position ? (
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Users className="w-4 h-4" />
              </motion.div>
            ) : (
              pos
            )}
          </motion.div>
        ))}
        
        {totalInQueue > 10 && (
          <span className="text-xs text-gray-500 ml-2">
            +{totalInQueue - 10} more
          </span>
        )}
      </div>
      
      <div className="text-center">
        <p className="text-xs text-gray-500">
          {position === 1 ? "You're up next!" : `${position - 1} ahead of you`}
        </p>
      </div>
    </div>
  );
}

// Floating action animation for waitlist buttons
export function FloatingWaitlistButton({ 
  children, 
  onClick, 
  isLoading = false, 
  className = "" 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  isLoading?: boolean; 
  className?: string; 
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`relative ${className}`}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
      }}
      whileTap={{ scale: 0.95 }}
      animate={{
        y: [0, -2, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      disabled={isLoading}
    >
      {children}
      
      {/* Pulse effect for attention */}
      <motion.div
        className="absolute inset-0 rounded-lg border-2 border-primary"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-white bg-opacity-80 rounded-lg flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <LoadingDots />
        </motion.div>
      )}
    </motion.button>
  );
}

// Success celebration animation
export function WaitlistSuccessAnimation({ 
  message = "Spot available!", 
  onComplete 
}: { 
  message?: string; 
  onComplete?: () => void; 
}) {
  return (
    <motion.div
      className="flex flex-col items-center space-y-4 p-6"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onAnimationComplete={onComplete}
    >
      {/* Celebration icon */}
      <motion.div
        className="relative"
        animate={{
          rotate: [0, 10, -10, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: 3,
          ease: "easeInOut",
        }}
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Zap className="w-8 h-8 text-green-600" />
        </div>
        
        {/* Confetti particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            style={{
              top: '50%',
              left: '50%',
            }}
            animate={{
              x: [0, Math.cos(i * 60 * Math.PI / 180) * 40],
              y: [0, Math.sin(i * 60 * Math.PI / 180) * 40],
              opacity: [1, 0],
              scale: [1, 0],
            }}
            transition={{
              duration: 1,
              delay: 0.3,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>
      
      <motion.h3
        className="text-lg font-semibold text-green-700"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 0.6,
          repeat: 2,
          ease: "easeInOut",
        }}
      >
        {message}
      </motion.h3>
    </motion.div>
  );
}