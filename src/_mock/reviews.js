import { faker } from '@faker-js/faker';
import { sample } from 'lodash';

// ----------------------------------------------------------------------

const reviews = [...Array(24)].map((_, index) => ({
  id: faker.datatype.uuid(),
  avatarUrl: `/assets/images/avatars/avatar_${index + 1}.jpg`,
  serviceUrl: `/assets/images/service/service_${1 || 2}.png`,
  postedDate: sample(['22-08-2022', '05-09-2022', '18-10-2022', '03-11-2022', '15-12-2022']),
  name: faker.name.fullName(),
  service: sample([
    'Fixing Anroid Smart Devices around Interior and Wiring',
    'Black and White Spot in display and blur Images',
  ]),
  rattings: sample(['3.5', '3.6', '4.5', '5.0', '4.0']),
  serviceReviews: sample([
    'Exceptional service! Quick response times and professional assistance. Highly impressed.',
    'Outstanding customer support. Their team goes above and beyond to resolve issues promptly.',
    'Reliable services with a personal touch. Attention to detail truly sets them apart.',
    'Flawless experience from start to finish. Efficient, friendly, and exceeded my expectations.',
    'Impeccable service quality. Dedication to customer satisfaction is truly commendable.',
  ]),
}));

export default reviews;
