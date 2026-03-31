'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import { DragIndicator } from '@mui/icons-material';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move'
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      sx={{ position: 'relative' }}
    >
      <Box
        {...listeners}
        sx={{
          position: 'absolute',
          left: -30,
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: 'move',
          color: 'text.secondary',
          '&:hover': {
            color: 'primary.main'
          }
        }}
      >
        <DragIndicator />
      </Box>
      {children}
    </Box>
  );
};