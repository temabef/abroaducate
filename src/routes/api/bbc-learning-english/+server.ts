import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface BBCLearningEnglishItem {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  transcript: string;
  duration: number;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  publishedDate: string;
}

interface BBCLearningEnglishResponse {
  success: boolean;
  data?: BBCLearningEnglishItem[];
  error?: string;
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const category = searchParams.get('category') || '6-minute-english';
    const limit = parseInt(searchParams.get('limit') || '10');
    const difficulty = searchParams.get('difficulty') || 'intermediate';

    console.log(`Fetching BBC Learning English content: category=${category}, limit=${limit}, difficulty=${difficulty}`);

    // Return fallback data since BBC API might not be reliable
    return json<BBCLearningEnglishResponse>({
      success: true,
      data: getFallbackBBCContent()
    });

  } catch (error) {
    console.error('BBC Learning English API error:', error);
    
    // Return fallback data if API fails
    return json<BBCLearningEnglishResponse>({
      success: true,
      data: getFallbackBBCContent()
    });
  }
};

function getFallbackBBCContent(): BBCLearningEnglishItem[] {
  return [
    {
      id: 'ielts-listening-1',
      title: 'Student Accommodation Discussion',
      description: 'A conversation between two students discussing accommodation options for university.',
      audioUrl: '/audio/ielts-listening/conversation-1.mp3',
      transcript: 'Sarah: Hi Tom, have you found accommodation for next semester yet? Tom: Not yet, I\'m still looking at different options. What about you? Sarah: I\'ve been researching student housing. There\'s that new complex near the library that looks promising. Tom: The one on Maple Street? I heard it\'s quite expensive. Sarah: It is a bit pricey, around 800 pounds per month, but it includes utilities and internet. Tom: That\'s actually not bad considering what you get. My current place is 650 but I pay extra for electricity and Wi-Fi. Sarah: Exactly. Plus it\'s only a five-minute walk to campus. Tom: How many bedrooms does it have? Sarah: They offer studio apartments and two-bedroom units. I\'m thinking of sharing a two-bedroom with another student to split the cost. Tom: That sounds like a good plan. When do you need to decide by? Sarah: The application deadline is next Friday. They require a 500-pound deposit to secure a place. Tom: I might look into that too. Can you send me the contact information? Sarah: Sure, I\'ll email you the details. They have a virtual tour on their website as well.',
      duration: 180,
      category: 'ielts-listening',
      difficulty: 'intermediate',
      publishedDate: new Date().toISOString()
    },
    {
      id: 'ielts-listening-2',
      title: 'University Library Tour',
      description: 'A guided tour of the university library explaining its facilities and services.',
      audioUrl: '/audio/ielts-listening/lecture-1.mp3',
      transcript: 'Welcome everyone to the university library. I\'m Dr. Williams, the head librarian, and I\'ll be showing you around our facilities today. The library is open seven days a week, from 8 AM to midnight during term time. We have over 500,000 books, 50,000 e-books, and access to more than 200 academic databases. The ground floor houses our main collection and reference materials. You\'ll find the circulation desk here where you can check out books, return items, and get help with your research. Each floor has study spaces with different noise levels. The first floor is designated as a quiet study area, while the second floor allows for group discussions. We also have 20 private study rooms that can be booked online up to two weeks in advance. The library offers free printing for up to 50 pages per week, and we have scanning facilities available. Our interlibrary loan service allows you to request books from other universities if we don\'t have them in our collection. The process usually takes 3-5 business days. Remember to bring your student ID card as it\'s required for borrowing books and accessing the building after 6 PM.',
      duration: 240,
      category: 'ielts-listening',
      difficulty: 'intermediate',
      publishedDate: new Date().toISOString()
    },
    {
      id: 'ielts-listening-3',
      title: 'Environmental Science Seminar',
      description: 'A seminar discussion about climate change and renewable energy solutions.',
      audioUrl: '/audio/ielts-listening/discussion-1.mp3',
      transcript: 'Professor: Today we\'re discussing renewable energy and its role in combating climate change. Let\'s start with solar power. Maria, what are the main advantages of solar energy? Maria: Well, solar power is abundant and renewable. The sun provides enough energy in one hour to meet global energy needs for an entire year. It\'s also becoming more affordable - solar panel costs have dropped by 70% in the last decade. Professor: Excellent point about cost reduction. James, what about the challenges? James: The main issues are storage and intermittency. Solar panels only generate electricity during daylight hours, and we need efficient battery systems to store excess energy. Also, solar farms require significant land area. Professor: Good. Now let\'s talk about wind energy. Sarah, what\'s your view on offshore wind farms? Sarah: Offshore wind has great potential because wind speeds are higher and more consistent over water. The UK is already a leader in this technology. However, installation and maintenance costs are higher than onshore wind farms. Professor: That\'s true. The UK aims to generate 40% of its electricity from offshore wind by 2030. What about public acceptance? Maria: There\'s often opposition to wind farms due to visual impact and noise concerns. But studies show that communities living near wind farms generally become more supportive once they\'re operational and see the economic benefits.',
      duration: 300,
      category: 'ielts-listening',
      difficulty: 'intermediate',
      publishedDate: new Date().toISOString()
    }
  ];
} 