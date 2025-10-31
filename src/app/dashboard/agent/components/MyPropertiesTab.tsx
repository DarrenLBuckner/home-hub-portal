import React from 'react';
import UniversalPropertyManager from '@/components/UniversalPropertyManager';

export default function MyPropertiesTab({ userId }: { userId: string }) {
  return (
    <div>
      <UniversalPropertyManager 
        userId={userId} 
        userType="agent"
        createPropertyPath="/dashboard/agent/create-property"
        editPropertyPath="/dashboard/agent/edit-property"
      />
    </div>
  );
}
