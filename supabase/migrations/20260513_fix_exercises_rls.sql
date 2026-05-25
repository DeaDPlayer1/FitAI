-- FIX: Add RLS policies for custom exercise creation
-- Allow users to insert their own exercises
CREATE POLICY "Users can create their own exercises" 
ON exercises FOR INSERT 
WITH CHECK (auth.uid() = created_by AND is_custom = true);

-- Allow users to update their own exercises
CREATE POLICY "Users can update their own exercises" 
ON exercises FOR UPDATE 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own exercises
CREATE POLICY "Users can delete their own exercises" 
ON exercises FOR DELETE 
USING (auth.uid() = created_by);
