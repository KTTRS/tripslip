-- Row-Level Security policies for student and payment data
-- Migration: 20240101000007_rls_student_payment_policies.sql

-- =====================================================
-- ENABLE RLS ON STUDENT AND PAYMENT TABLES
-- =====================================================

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DISTRICTS POLICIES
-- =====================================================

-- Districts: District admins can view their district
CREATE POLICY "District admins can view their district"
  ON districts FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM districts WHERE id = districts.id
    )
  );

-- Districts: District admins can update their district
CREATE POLICY "District admins can update their district"
  ON districts FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM districts WHERE id = districts.id
    )
  );

-- =====================================================
-- SCHOOLS POLICIES
-- =====================================================

-- Schools: School admins can view their school
CREATE POLICY "School admins can view their school"
  ON schools FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM schools WHERE id = schools.id
    )
  );

-- Schools: District admins can view schools in their district
CREATE POLICY "District admins can view schools in their district"
  ON schools FOR SELECT
  USING (
    district_id IN (
      SELECT id FROM districts WHERE user_id = auth.uid()
    )
  );

-- Schools: School admins can update their school
CREATE POLICY "School admins can update their school"
  ON schools FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM schools WHERE id = schools.id
    )
  );

-- =====================================================
-- TEACHERS POLICIES
-- =====================================================

-- Teachers: Teachers can view their own profile
CREATE POLICY "Teachers can view their own profile"
  ON teachers FOR SELECT
  USING (auth.uid() = user_id);

-- Teachers: Teachers can update their own profile
CREATE POLICY "Teachers can update their own profile"
  ON teachers FOR UPDATE
  USING (auth.uid() = user_id);

-- Teachers: Teachers can create their own profile
CREATE POLICY "Teachers can create their own profile"
  ON teachers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Teachers: School admins can view teachers in their school
CREATE POLICY "School admins can view teachers in their school"
  ON teachers FOR SELECT
  USING (
    school_id IN (
      SELECT id FROM schools WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- ROSTERS POLICIES
-- =====================================================

-- Rosters: Teachers can view their own rosters
CREATE POLICY "Teachers can view their own rosters"
  ON rosters FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  );

-- Rosters: Teachers can manage their own rosters
CREATE POLICY "Teachers can manage their own rosters"
  ON rosters FOR ALL
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- STUDENTS POLICIES
-- =====================================================

-- Students: Teachers can view students in their rosters
CREATE POLICY "Teachers can view students in their rosters"
  ON students FOR SELECT
  USING (
    roster_id IN (
      SELECT id FROM rosters WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Students: Teachers can manage students in their rosters
CREATE POLICY "Teachers can manage students in their rosters"
  ON students FOR ALL
  USING (
    roster_id IN (
      SELECT id FROM rosters WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    roster_id IN (
      SELECT id FROM rosters WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Students: Parents can view their children
CREATE POLICY "Parents can view their children"
  ON students FOR SELECT
  USING (
    id IN (
      SELECT student_id FROM student_parents WHERE parent_id IN (
        SELECT id FROM parents WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- PARENTS POLICIES
-- =====================================================

-- Parents: Parents can view their own profile
CREATE POLICY "Parents can view their own profile"
  ON parents FOR SELECT
  USING (auth.uid() = user_id);

-- Parents: Parents can update their own profile
CREATE POLICY "Parents can update their own profile"
  ON parents FOR UPDATE
  USING (auth.uid() = user_id);

-- Parents: Parents can create their own profile
CREATE POLICY "Parents can create their own profile"
  ON parents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Parents: Teachers can view parents of students in their rosters
CREATE POLICY "Teachers can view parents of students in their rosters"
  ON parents FOR SELECT
  USING (
    id IN (
      SELECT parent_id FROM student_parents WHERE student_id IN (
        SELECT id FROM students WHERE roster_id IN (
          SELECT id FROM rosters WHERE teacher_id IN (
            SELECT id FROM teachers WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- =====================================================
-- STUDENT_PARENTS POLICIES
-- =====================================================

-- Student-parents: Teachers can view relationships for their roster students
CREATE POLICY "Teachers can view relationships for their roster students"
  ON student_parents FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE roster_id IN (
        SELECT id FROM rosters WHERE teacher_id IN (
          SELECT id FROM teachers WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Student-parents: Teachers can manage relationships for their roster students
CREATE POLICY "Teachers can manage relationships for their roster students"
  ON student_parents FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE roster_id IN (
        SELECT id FROM rosters WHERE teacher_id IN (
          SELECT id FROM teachers WHERE user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE roster_id IN (
        SELECT id FROM rosters WHERE teacher_id IN (
          SELECT id FROM teachers WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Student-parents: Parents can view their own relationships
CREATE POLICY "Parents can view their own relationships"
  ON student_parents FOR SELECT
  USING (
    parent_id IN (
      SELECT id FROM parents WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================

-- Payments: Parents can view their own payments
CREATE POLICY "Parents can view their own payments"
  ON payments FOR SELECT
  USING (
    parent_id IN (
      SELECT id FROM parents WHERE user_id = auth.uid()
    )
  );

-- Payments: Parents can view payments for their children's slips
CREATE POLICY "Parents can view payments for their children's slips"
  ON payments FOR SELECT
  USING (
    permission_slip_id IN (
      SELECT id FROM permission_slips WHERE student_id IN (
        SELECT student_id FROM student_parents WHERE parent_id IN (
          SELECT id FROM parents WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Payments: Venue users can view payments for their experience trips
CREATE POLICY "Venue users can view payments for their experience trips"
  ON payments FOR SELECT
  USING (
    permission_slip_id IN (
      SELECT id FROM permission_slips WHERE trip_id IN (
        SELECT id FROM trips WHERE experience_id IN (
          SELECT id FROM experiences WHERE venue_id IN (
            SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- Payments: Teachers can view payments for their trips
CREATE POLICY "Teachers can view payments for their trips"
  ON payments FOR SELECT
  USING (
    permission_slip_id IN (
      SELECT id FROM permission_slips WHERE trip_id IN (
        SELECT id FROM trips WHERE teacher_id IN (
          SELECT id FROM teachers WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =====================================================
-- REFUNDS POLICIES
-- =====================================================

-- Refunds: Parents can view their own refunds
CREATE POLICY "Parents can view their own refunds"
  ON refunds FOR SELECT
  USING (
    payment_id IN (
      SELECT id FROM payments WHERE parent_id IN (
        SELECT id FROM parents WHERE user_id = auth.uid()
      )
    )
  );

-- Refunds: Venue users can view refunds for their experience trips
CREATE POLICY "Venue users can view refunds for their experience trips"
  ON refunds FOR SELECT
  USING (
    payment_id IN (
      SELECT id FROM payments WHERE permission_slip_id IN (
        SELECT id FROM permission_slips WHERE trip_id IN (
          SELECT id FROM trips WHERE experience_id IN (
            SELECT id FROM experiences WHERE venue_id IN (
              SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
            )
          )
        )
      )
    )
  );

-- Refunds: Teachers can view refunds for their trips
CREATE POLICY "Teachers can view refunds for their trips"
  ON refunds FOR SELECT
  USING (
    payment_id IN (
      SELECT id FROM payments WHERE permission_slip_id IN (
        SELECT id FROM permission_slips WHERE trip_id IN (
          SELECT id FROM trips WHERE teacher_id IN (
            SELECT id FROM teachers WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Notifications: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- AUDIT LOGS POLICIES
-- =====================================================

-- Audit logs: Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Audit logs: System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);
