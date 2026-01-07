-- Comments Policies
CREATE POLICY "Comments are viewable by anyone involved" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Logged in users can post comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);
