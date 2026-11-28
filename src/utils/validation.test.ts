import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, isUniversityEmail, validatePassword, validateRegistration } from './validation';
import { canPerform, isAdmin } from './permissions';

test('email validation correctly accepts valid format', () => {
  assert.equal(isValidEmail('raiyan19@student.baust.edu.bd'), true);
  assert.equal(isValidEmail('teacher@du.ac.bd'), true);
  assert.equal(isValidEmail('invalid-email'), false);
  assert.equal(isValidEmail(''), false);
});

test('university domain check identifies institutional emails', () => {
  assert.equal(isUniversityEmail('raiyan@baust.edu.bd', 'baust.edu.bd'), true);
  assert.equal(isUniversityEmail('raiyan19@student.baust.edu.bd', 'baust.edu.bd'), true);
  assert.equal(isUniversityEmail('student@du.ac.bd', 'baust.edu.bd'), false);
  assert.equal(isUniversityEmail('fake@notbaust.edu.bd', 'baust.edu.bd'), false);
  assert.equal(isUniversityEmail('student@gmail.com', 'baust.edu.bd'), false);
  assert.equal(isUniversityEmail('student@du.ac.bd', 'du.ac.bd'), true);
});

test('password validation enforces minimum length', () => {
  assert.equal(validatePassword('12345').isValid, false);
  assert.equal(validatePassword('password123').isValid, true);
});

test('registration payload validation checks student specific fields', () => {
  const invalidStudent = validateRegistration({
    name: 'Sultan Raiyan',
    email: 'raiyan@baust.edu.bd',
    password: 'password123',
    role: 'student',
    universityId: 'univ-baust',
    departmentId: 'dept-cse',
    studentId: '', // Missing
  });
  assert.equal(invalidStudent.isValid, false);
  assert.ok(invalidStudent.errors.studentId);

  const validStudent = validateRegistration({
    name: 'Sultan Raiyan',
    email: 'raiyan@baust.edu.bd',
    password: 'password123',
    role: 'student',
    universityId: 'univ-baust',
    departmentId: 'dept-cse',
    studentId: '20221015',
  });
  assert.equal(validStudent.isValid, true);

  const personalEmailStudent = validateRegistration(
    {
      name: 'Sultan Raiyan',
      email: 'raiyan@gmail.com',
      password: 'password123',
      role: 'student',
      universityId: 'univ-baust',
      departmentId: 'dept-cse',
      studentId: '20221015',
    },
    'baust.edu.bd'
  );
  assert.equal(personalEmailStudent.isValid, false);
  assert.ok(personalEmailStudent.errors.email);

  const wrongUnivTeacher = validateRegistration(
    {
      name: 'Dr. Aminul Islam',
      email: 'aminul@du.ac.bd',
      password: 'password123',
      role: 'teacher',
      universityId: 'univ-baust',
      departmentId: 'dept-cse',
      designation: 'Professor',
    },
    'baust.edu.bd'
  );
  assert.equal(wrongUnivTeacher.isValid, false);
  assert.ok(wrongUnivTeacher.errors.email);

  const validTeacher = validateRegistration(
    {
      name: 'Dr. Aminul Islam',
      email: 'aminul@baust.edu.bd',
      password: 'password123',
      role: 'teacher',
      universityId: 'univ-baust',
      departmentId: 'dept-cse',
      designation: 'Professor',
    },
    'baust.edu.bd'
  );
  assert.equal(validTeacher.isValid, true);
});

test('RBAC permissions allow admin privileges and restrict students', () => {
  assert.equal(canPerform('admin', 'manage_users'), true);
  assert.equal(canPerform('admin', 'manage_universities'), true);
  assert.equal(canPerform('student', 'manage_users'), false);
  assert.equal(canPerform('student', 'create_listing'), true);
  assert.equal(canPerform('teacher', 'manage_departments'), false);
  assert.equal(isAdmin('admin'), true);
  assert.equal(isAdmin('student'), false);
});
