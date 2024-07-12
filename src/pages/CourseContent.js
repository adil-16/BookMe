import React, { useState } from 'react';
import {
  Grid,
  Typography,
  Stack,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { AppOrderTimeline } from '../sections/@dashboard/app';
import { faker } from '@faker-js/faker';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  // Define your styles here
});

const chaptersAndTopics = [
  {
    chapter: 'Understanding Time Management Fundamentals',
    topics: [
      'Importance of Time Management',
      'Benefits of Effective Time Management',
      'Time Management Myths and Misconceptions',
      'Impact of Poor Time Management',
      'Principles of Effective Time Management',
    ],
  },
  {
    chapter: 'Setting Clear Goals and Priorities',
    topics: [
      'Goal Setting Techniques for Effective Time Management',
      'SMART Goals: Specific, Measurable, Achievable, Relevant, Time-Bound',
      'Prioritization Methods: Eisenhower Matrix, ABCD Method, Value vs. Urgency',
      'Aligning Goals with Values and Long-Term Vision',
      'Creating a Personal Mission Statement',
    ],
  },
  {
    chapter: 'Planning and Organizing Your Time',
    topics: [
      'Creating Daily, Weekly, and Monthly Planners',
      'Time Blocking: Allocating Time for Specific Tasks',
      'Using To-Do Lists Effectively',
      'Creating Routines and Rituals',
      'Handling Procrastination and Overcoming Distractions',
    ],
  },
  {
    chapter: 'Efficient Time Management Strategies',
    topics: [
      'Pomodoro Technique: Work-Rest Cycles',
      'Batch Processing and Task Bundling',
      'Using Technology for Time Management (Apps, Tools, Calendars)',
      'Delegation and Outsourcing',
      'Single-Tasking vs. Multitasking',
    ],
  },
  {
    chapter: 'Developing Time Management Habits',
    topics: [
      'Habit Formation and the Power of Consistency',
      'Overcoming Resistance to Change',
      'Mindfulness and Time Management',
      'Tracking and Analyzing Time Usage',
      'Continuous Improvement and Adjusting Your Approach',
    ],
  },
];

const CourseContent = () => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');

  const handleOpenModal = (topic) => {
    console.log('Opening modal for topic:', topic);
    setSelectedTopic(topic);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    console.log('Closing modal');
    setOpenModal(false);
  };

  return (
    <div>
      <Helmet>
        <title> Course Content | Lauenroth</title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="start" mb={5}>
          <Typography variant="h4" gutterBottom>
            Course : Time Management
          </Typography>
        </Stack>
        <Grid container spacing={3}>
          {chaptersAndTopics.map((chapterData, index) => (
            <Grid item xs={12} md={6} lg={4} key={chapterData.chapter}>
              <AppOrderTimeline
                title={' Chapter ' + (index + 1) + ' - ' + chapterData.chapter}
                list={chapterData.topics.map((topic, topicIndex) => ({
                  id: faker.datatype.uuid(),
                  title: topic,
                  type: `order${topicIndex + 1}`,
                  clicked: () => handleOpenModal(topic),
                }))}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>{selectedTopic}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptates eos consequuntur corporis earum vero
            nobis inventore tempora tenetur, ipsa laborum nisi? Excepturi nemo sed odit, sequi distinctio laboriosam
            quisquam reiciendis recusandae perferendis assumenda, voluptatem maiores vitae dolorum molestiae rerum?
            Earum quae non.
            <video className='w-100'
              controls="true"
              src="https://firebasestorage.googleapis.com/v0/b/lauenroth-15969.appspot.com/o/Course_Videos%2F1691836924191_Tips%20for%20Effective%20Time%20Management.mp4?alt=media&amp;token=653c0abc-b1f8-478b-998a-4a60f4146ab2"
            ></video>
            <p>
              <br />
            </p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque assumenda quam quod culpa, illo voluptatem iure quisquam fuga veniam saepe?
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseContent;
