const ImageExtractionStrategyFactory = require('./strategies/ImageExtractionStrategyFactory');
const { EXTRACTION_PROMPT } = require('../config/prompts');
const fs = require('fs').promises;
const path = require('path');

// Initialize the strategy factory
const strategyFactory = new ImageExtractionStrategyFactory();

async function extractDataFromImage(fileBuffer, sourceFilename, mimeType = 'image/jpeg') {

  const strategy = strategyFactory.getStrategy();

  try {
    const result = await strategy.extractEventsFromImage(EXTRACTION_PROMPT, fileBuffer, sourceFilename, mimeType);
    return result;
  } catch (error) {
    console.error('=== IMAGE SERVICE: Error in extraction ===', error);
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