const ImageExtractionStrategyFactory = require('./strategies/ImageExtractionStrategyFactory');
const { IMAGE_EXTRACTION_PROMPT } = require('../config/prompts');
const fs = require('fs').promises;
const path = require('path');

// Initialize the strategy factory
const strategyFactory = new ImageExtractionStrategyFactory();

async function extractDataFromImage(prompt, fileBuffer, sourceFilename, mimeType = 'image/jpeg') {
  console.log('=== IMAGE SERVICE: Starting file extraction ===');
  console.log('Parameters received:', {
    promptLength: prompt.length,
    bufferSize: fileBuffer.length,
    sourceFilename,
    mimeType
  });
  
  // Get the appropriate strategy
  const strategy = strategyFactory.getStrategy();
  console.log(`=== IMAGE SERVICE: Using ${strategy.getStrategyName()} ===`);
  
  try {
    // Use the strategy to extract events
    const result = await strategy.extractEventsFromImage(prompt, fileBuffer, sourceFilename, mimeType);
    
    // Ensure each event has todos array
    if (Array.isArray(result)) {
      result.forEach(event => {
        if (!event.todos) {
          event.todos = [];
          // Add default todos based on event type
          if (event.category === 'holiday') {
            event.todos.push({
              id: crypto.randomUUID(),
              text: 'Plan child care for holiday',
              completed: false
            });
          } else if (event.category === 'birthday') {
            event.todos.push({
              id: crypto.randomUUID(),
              text: 'Buy gift for birthday',
              completed: false
            });
          }
        }
      });
    }

    console.log('=== IMAGE SERVICE: Extraction completed successfully ===');
    return result;
  } catch (error) {
    console.error('=== IMAGE SERVICE: Error in extraction ===');
    console.error('Error extracting data from image:', error);
    throw error;
  }
}

// Mock data functions for testing
function getMockEventData() {
  return [
    {
      title: 'School Sports Day',
      date: '2024-06-15',
      time: '09:00 - 15:00',
      venue: 'School Grounds',
      yearGroup: 'All',
      category: 'sports',
      source: 'mock_data',
      todos: [
        {
          id: '1',
          text: 'Pack sports clothes',
          completed: false
        },
        {
          id: '2',
          text: 'Bring water bottle',
          completed: false
        }
      ]
    }
  ];
}

function getMockArrayEventData(){
  return [
    {
      title: 'Parent-Teacher Meeting',
      date: '2024-06-20',
      time: '14:00 - 15:00',
      venue: 'School Hall',
      yearGroup: 'Year 3',
      category: 'academic',
      source: 'mock_data',
      todos: [
        {
          id: '1',
          text: 'Prepare questions for teacher',
          completed: false
        }
      ]
    },
    {
      title: 'School Trip to Museum',
      date: '2024-06-25',
      time: '09:30 - 15:30',
      venue: 'Natural History Museum',
      yearGroup: 'Year 4',
      category: 'trip',
      source: 'mock_data',
      todos: [
        {
          id: '1',
          text: 'Pack lunch',
          completed: false
        },
        {
          id: '2',
          text: 'Bring permission slip',
          completed: false
        }
      ]
    }
  ];
}

module.exports = {
  extractDataFromImage,
  getMockEventData,
  getMockArrayEventData
}; 