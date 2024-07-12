import { faker } from '@faker-js/faker';
import { sample } from 'lodash';

// ----------------------------------------------------------------------

const services = [...Array(24)].map((_, index) => ({
  id: faker.datatype.uuid(),
  avatarUrl: `/assets/images/avatars/avatar_${index + 1}.jpg`,
  serviceUrl: `/assets/images/service/service_${1 || 2}.png`,
  name: faker.name.fullName(),
  service: sample([
    'Fixing Anroid Smart Devices around Interior and Wiring',
    'Black and White Spot in display and blur Images',
  ]),
  company: sample(['Newyork', 'London', 'Islamabad']),
  price: sample(['$233', '$149', '$299', '$89', '$419']),
  postedDate: sample(['22-08-2023', '05-09-2023', '18-10-2023', '03-11-2023', '15-12-2023']),
  isVerified: faker.datatype.boolean(),
  status: sample(['active', 'pending', 'completed']),
  rattings: sample(['3.5', '3.6', '4.5', '5.0', '4.0']),
  role: sample(['Mechanic', 'Photographer', 'Carpanter']),
}));

export default services;
