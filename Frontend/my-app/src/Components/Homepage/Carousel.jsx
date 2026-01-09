import React, { useState, useEffect } from 'react';

const Carousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      title: "Empowering Education",
      description: "Enhance your teaching methodology with AI-driven insights."
    },
    {
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      title: "Student-Centric Feedback",
      description: "Understand your students' needs better through detailed analytics."
    },
    {
      image: "https://images.unsplash.com/photo-1427504743050-dad1d8d17995?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      title: "Data-Driven Decisions",
      description: "Make informed decisions to improve academic performance."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="w-full ">
      <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
        <div className="relative w-full rounded-lg shadow-2xl overflow-hidden h-[450px]">
          <div
            className="flex transition-transform ease-in-out duration-700 h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div key={index} className="w-full flex-shrink-0 h-full">
                <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        <div className="relative w-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`transition-opacity duration-700 ${
                currentSlide === index ? 'opacity-100' : 'opacity-0 absolute top-0'
              }`}
            >
              <h3 className="text-3xl md:text-4xl font-bold">{slide.title}</h3>
              <p className="mt-4 text-lg text-gray-600">{slide.description}</p>
            </div>
          ))}

          <div className="mt-8 flex space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  currentSlide === index
                    ? 'bg-blue-500'
                    : 'bg-gray-300 hover:bg-blue-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carousel;