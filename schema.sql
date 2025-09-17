-- Supabase Database Schema for Todo App

-- Enable Row Level Security
ALTER DATABASE postgres SET timezone TO 'UTC';

-- Lists table (multiple todo lists per user)
CREATE TABLE lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Todos table
CREATE TABLE todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Periodic task fields
    is_periodic BOOLEAN DEFAULT FALSE,
    period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
    period_days INTEGER, -- for custom periods, number of days
    last_completed_at TIMESTAMP WITH TIME ZONE, -- when the periodic task was last completed

    -- Snooze fields
    is_snoozed BOOLEAN DEFAULT FALSE,
    snoozed_until TIMESTAMP WITH TIME ZONE,

    -- For ordering completed periodic tasks
    original_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Lists policies
CREATE POLICY "Users can view their own lists" ON lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lists" ON lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" ON lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" ON lists
    FOR DELETE USING (auth.uid() = user_id);

-- Todos policies
CREATE POLICY "Users can view their own todos" ON todos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos" ON todos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" ON todos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" ON todos
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_todos_list_id ON todos(list_id);
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_is_completed ON todos(is_completed);
CREATE INDEX idx_todos_is_periodic ON todos(is_periodic);
CREATE INDEX idx_todos_snoozed_until ON todos(snoozed_until);

-- Function to calculate days on list
CREATE OR REPLACE FUNCTION calculate_days_on_list(todo_created_at TIMESTAMP WITH TIME ZONE, todo_completed_at TIMESTAMP WITH TIME ZONE, todo_is_completed BOOLEAN)
RETURNS INTEGER AS $$
BEGIN
    IF todo_is_completed AND todo_completed_at IS NOT NULL THEN
        -- If completed, reset the counter (return 0 since it was just completed)
        RETURN 0;
    ELSE
        -- If not completed, calculate days since creation
        RETURN EXTRACT(DAY FROM NOW() - todo_created_at)::INTEGER;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate periodic todos
CREATE OR REPLACE FUNCTION generate_periodic_todos()
RETURNS TRIGGER AS $$
DECLARE
    days_to_add INTEGER;
    new_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Only proceed if the todo was just completed and is periodic
    IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE AND NEW.is_periodic = TRUE THEN
        -- Calculate days to add based on period type
        CASE NEW.period_type
            WHEN 'daily' THEN days_to_add := 1;
            WHEN 'weekly' THEN days_to_add := 7;
            WHEN 'monthly' THEN days_to_add := 30;
            WHEN 'quarterly' THEN days_to_add := 90;
            WHEN 'yearly' THEN days_to_add := 365;
            WHEN 'custom' THEN days_to_add := NEW.period_days;
            ELSE days_to_add := 1;
        END CASE;

        -- Set the new creation date
        new_created_at := NOW() + (days_to_add || ' days')::INTERVAL;

        -- Insert new periodic todo
        INSERT INTO todos (
            list_id, user_id, title, description, is_periodic,
            period_type, period_days, created_at, original_created_at,
            last_completed_at
        ) VALUES (
            NEW.list_id, NEW.user_id, NEW.title, NEW.description, NEW.is_periodic,
            NEW.period_type, NEW.period_days, new_created_at, NEW.original_created_at,
            NEW.completed_at
        );

        -- Update the current todo's last_completed_at
        UPDATE todos
        SET last_completed_at = NEW.completed_at
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generating periodic todos
CREATE TRIGGER trigger_generate_periodic_todos
    AFTER UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION generate_periodic_todos();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();