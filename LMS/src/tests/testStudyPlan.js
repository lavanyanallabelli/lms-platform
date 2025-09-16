// Test file to debug study plan generation
import { generateStudyPlan } from '../services/openaiService';

const testStudyPlan = async () => {
    console.log('=== Testing Study Plan Generation ===');

    const testData = {
        goals: 'Learn mathematics and improve problem-solving skills',
        availableTime: 10,
        subjects: ['Mathematics', 'Science']
    };

    console.log('Test input:', testData);

    try {
        const result = await generateStudyPlan(
            testData.goals,
            testData.availableTime,
            testData.subjects
        );

        console.log('✅ Study plan generated successfully:', result);

        // Validate the result structure
        if (result && result.weeklySchedule) {
            console.log('✅ Result has weeklySchedule');
            console.log('Weekly schedule:', result.weeklySchedule);
        } else {
            console.error('❌ Result missing weeklySchedule');
        }

        if (result && result.priorities) {
            console.log('✅ Result has priorities:', result.priorities);
        } else {
            console.error('❌ Result missing priorities');
        }

        if (result && result.breakRecommendations) {
            console.log('✅ Result has break recommendations:', result.breakRecommendations);
        } else {
            console.error('❌ Result missing break recommendations');
        }

        if (result && result.milestones) {
            console.log('✅ Result has milestones:', result.milestones);
        } else {
            console.error('❌ Result missing milestones');
        }

        return result;
    } catch (error) {
        console.error('❌ Study plan generation failed:', error);
        return null;
    }
};

// Export for use in the browser console
window.testStudyPlan = testStudyPlan;

export default testStudyPlan;
