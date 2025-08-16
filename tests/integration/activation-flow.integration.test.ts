
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';
import type { User } from '@/lib/types';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActivationWarning } from '@/components/ActivationWarning';
import React from 'react'; // Import React for JSX

// This test simulates the user activation flow to ensure correct redirection logic.

const PROJECT_ID = 'corabo-demo-test-activation';

// A mock router to track navigation calls
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/', // Mock current path
}));

// Mock Corabo context to control user state
let mockCurrentUser: User | null = null;
const mockCoraboContext = {
  get currentUser() {
    return mockCurrentUser;
  }
};

jest.mock('@/contexts/CoraboContext', () => ({
  useCorabo: () => mockCoraboContext,
}));

describe('Activation Flow - Integration Test', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: 'localhost',
        port: 8083,
        rules: fs.readFileSync(path.resolve(__dirname, '../../src/firestore.rules'), 'utf8'),
      },
    });
  });

  afterAll(async () => {
    // FIX: Check if testEnv was successfully initialized before cleanup.
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
    mockCurrentUser = null;
  });
  
  test('should redirect to /initial-setup if user has not completed it', () => {
    // Arrange: User exists but initial setup is incomplete
    mockCurrentUser = {
      id: 'user1',
      name: 'Test User',
      isInitialSetupComplete: false,
    } as User;

    // Act: Render the component and click the button
    render(<ActivationWarning userType="provider" />);
    const activationButton = screen.getByText('Activar ahora →');
    fireEvent.click(activationButton);

    // Assert: The user is redirected to the initial setup page
    expect(mockRouter.push).toHaveBeenCalledWith('/initial-setup');
  });
  
  test('should redirect to /profile-setup/verify-id if setup is complete but ID is not verified', () => {
    // Arrange: User has completed initial setup but ID is not verified
    mockCurrentUser = {
      id: 'user2',
      name: 'Test User 2',
      isInitialSetupComplete: true,
      idVerificationStatus: 'pending', // or 'rejected'
    } as User;

    // Act: Render the component and click the button
    render(<ActivationWarning userType="provider" />);
    const activationButton = screen.getByText('Activar ahora →');
    fireEvent.click(activationButton);

    // Assert: The user is redirected to the ID verification page
    expect(mockRouter.push).toHaveBeenCalledWith('/profile-setup/verify-id');
  });

  test('should redirect to /transactions/settings if ID is verified but transactions are inactive', () => {
    // Arrange: User is fully verified but transactions module is not yet active
    mockCurrentUser = {
      id: 'user3',
      name: 'Test User 3',
      isInitialSetupComplete: true,
      idVerificationStatus: 'verified',
      isTransactionsActive: false,
    } as User;

    // Act: Render the component and click the button
    render(<ActivationWarning userType="provider" />);
    const activationButton = screen.getByText('Activar ahora →');
    fireEvent.click(activationButton);

    // Assert: The user is redirected to the final activation step
    expect(mockRouter.push).toHaveBeenCalledWith('/transactions/settings');
  });
});
