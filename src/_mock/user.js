import { faker } from '@faker-js/faker';
import { sample } from 'lodash';

// ----------------------------------------------------------------------

const users = [...Array(24)].map((_, index) => ({
  id: faker.datatype.uuid(),
  avatarUrl: `/assets/images/avatars/avatar_${index + 1}.jpg`,
  name: faker.name.fullName(),
  company: sample(['Newyork','London','Islamabad']),
  isVerified: faker.datatype.boolean(),
  status: sample(['active', 'banned']),
  role: sample(['Mechanic', 'Photographer', 'Carpanter']),
}));

export default users;
