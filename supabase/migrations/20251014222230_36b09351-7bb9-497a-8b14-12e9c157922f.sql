-- Enable RLS on User table (currently has a policy but RLS is disabled)
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for User table
CREATE POLICY "Users can view their own profile"
ON public."User"
FOR SELECT
USING (auth.uid() = "User_Id");

CREATE POLICY "Users can update their own profile"
ON public."User"
FOR UPDATE
USING (auth.uid() = "User_Id");