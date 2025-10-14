-- Enable RLS on Persona table (currently disabled)
ALTER TABLE public."Persona" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Persona table
CREATE POLICY "Users can view their own personas"
ON public."Persona"
FOR SELECT
USING (auth.uid() = "User_Id");

CREATE POLICY "Users can create their own personas"
ON public."Persona"
FOR INSERT
WITH CHECK (auth.uid() = "User_Id");

CREATE POLICY "Users can update their own personas"
ON public."Persona"
FOR UPDATE
USING (auth.uid() = "User_Id");

CREATE POLICY "Users can delete their own personas"
ON public."Persona"
FOR DELETE
USING (auth.uid() = "User_Id");

-- Create RLS policies for Conversation table (RLS is enabled but no policies exist)
CREATE POLICY "Users can view their own conversations"
ON public."Conversation"
FOR SELECT
USING (auth.uid() = "User_id");

CREATE POLICY "Users can create their own conversations"
ON public."Conversation"
FOR INSERT
WITH CHECK (auth.uid() = "User_id");

CREATE POLICY "Users can update their own conversations"
ON public."Conversation"
FOR UPDATE
USING (auth.uid() = "User_id");

CREATE POLICY "Users can delete their own conversations"
ON public."Conversation"
FOR DELETE
USING (auth.uid() = "User_id");