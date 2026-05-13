
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useChildProfiles } from "@/contexts/ChildProfileContext";
import { Card } from "@/components/ui/card";
import { User } from "lucide-react";

const quotes = [
  {
    text: "Your greatest contribution to the universe may not be something you do, but someone you raise.",
    author: "Andy Stanley"
  },
  {
    text: "Behind every young child who believes in himself is a parent who believed first.",
    author: "Matthew L. Jacobson"
  },
  {
    text: "Your kids require you most of all to love them for who they are, not to spend your whole time trying to correct them.",
    author: "Bill Ayers"
  },
  {
    text: "There is no such thing as a perfect parent. So just be a real one.",
    author: "Sue Atkins"
  },
  {
    text: "Children are not things to be molded, but are people to be unfolded.",
    author: "Jess Lair"
  }
];

export const QuotesCarousel = () => {
  return (
    <div className="space-y-3 sm:space-y-6">
      <Carousel
        opts={{ loop: true, align: "center" }}
        className="w-full max-w-2xl mx-auto"
      >
        <CarouselContent>
          {quotes.map((quote, index) => (
            <CarouselItem key={index}>
              <div className="text-center p-2 sm:p-4">
                <p className="text-sm sm:text-lg italic text-muted-foreground mb-1 sm:mb-2">
                  "{quote.text}"
                </p>
                <span className="text-xs sm:text-sm font-medium">– {quote.author}</span>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <KidInfo />
    </div>
  );
};

function KidInfo() {
  const { selectedProfile } = useChildProfiles();

  if (!selectedProfile) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-2 sm:p-4 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <h3 className="font-semibold text-base sm:text-lg">{selectedProfile.name}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {selectedProfile.yearGroup} · {selectedProfile.schoolName}
        </p>
      </div>
    </div>
  );
}
