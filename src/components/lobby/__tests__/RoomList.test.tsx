import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import RoomList from '../RoomList'
import { Room } from '@/lib/services/roomService'
import { Timestamp } from 'firebase/firestore'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('RoomList', () => {
  const mockRooms: Room[] = [
    {
      id: '1',
      name: 'Test Room 1',
      createdBy: 'user1',
      creatorName: 'User One',
      createdAt: { seconds: 1625000000, nanoseconds: 0 } as Timestamp,
    },
    {
      id: '2',
      name: 'Test Room 2',
      createdBy: 'user2',
      creatorName: 'User Two',
      createdAt: { seconds: 1625000000, nanoseconds: 0 } as Timestamp,
      password: 'pass',
    },
  ]

  const mockOnDelete = jest.fn()
  const mockOnEnter = jest.fn()

  it('renders empty state when no rooms', () => {
    render(
      <RoomList
        rooms={[]}
        currentUserId="user1"
        isAdmin={false}
        onDelete={mockOnDelete}
        onEnter={mockOnEnter}
      />
    )
    expect(screen.getByText('Нет доступных комнат. Создайте новую!')).toBeInTheDocument()
  })

  it('renders list of rooms', () => {
    render(
      <RoomList
        rooms={mockRooms}
        currentUserId="user3"
        isAdmin={false}
        onDelete={mockOnDelete}
        onEnter={mockOnEnter}
      />
    )
    expect(screen.getByText('Test Room 1')).toBeInTheDocument()
    expect(screen.getByText('Test Room 2')).toBeInTheDocument()
    expect(screen.getByText('Создал(а) User One')).toBeInTheDocument()
  })

  it('calls onEnter when Enter button is clicked', () => {
    render(
      <RoomList
        rooms={mockRooms}
        currentUserId="user3"
        isAdmin={false}
        onDelete={mockOnDelete}
        onEnter={mockOnEnter}
      />
    )
    
    const enterButtons = screen.getAllByText('Войти').map(el => el.closest('button'))
    fireEvent.click(enterButtons[0]!)
    
    expect(mockOnEnter).toHaveBeenCalledWith(mockRooms[0])
  })

  it('shows delete button for admin', () => {
    render(
      <RoomList
        rooms={mockRooms}
        currentUserId="user3"
        isAdmin={true}
        onDelete={mockOnDelete}
        onEnter={mockOnEnter}
      />
    )
    
    const buttons = screen.getAllByRole('button')
    
    expect(buttons.length).toBeGreaterThan(mockRooms.length) 
  })
})
