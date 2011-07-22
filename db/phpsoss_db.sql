/***************************
 Database tables for the SOSS system.
 
 The SQL here uses MySQL specific data types and
 the AUTO_INCREMENT for id generation, so will not
 work on other DBMS..
 
 It currently doesn't use FOREIGN KEY constraints because
 of MySQL's lack of default support for them.
 ***************************/
 
DROP TABLE IF EXISTS class;
CREATE TABLE class (
  class_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  term VARCHAR(10) NOT NULL,
  theyear YEAR NOT NULL,
  active ENUM('Y','N') NOT NULL
);

DROP TABLE IF EXISTS students;
CREATE TABLE students (
   class_id BIGINT NOT NULL,
   username VARCHAR(70) NOT NULL,
   email VARCHAR(70) NOT NULL,
   lastname VARCHAR(25),
   firstname VARCHAR(25),
   passwd CHAR(40),
   grader_priv ENUM('N','Y') NOT NULL,
   PRIMARY KEY (class_id, username)
);

DROP TABLE IF EXISTS faculty;
CREATE TABLE faculty (
  passwd CHAR(40)
);
INSERT INTO faculty (passwd) VALUES ('5cee1c23e1604e9ae4f2c0e93bbb4c6eb72b5f2c');

/* May need to modify this table to include information about the test harness
   itself (location on the file system). */
DROP TABLE IF EXISTS assignments;
CREATE TABLE assignments (
  class_id BIGINT NOT NULL,
  name VARCHAR(50) NOT NULL,
  due DATETIME,
  auto_test ENUM('N','Y'),
  PRIMARY KEY (class_id, name)
);

DROP TABLE IF EXISTS files;
CREATE TABLE files (
  id_num BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_class_id BIGINT NOT NULL,
  student_username VARCHAR(70) NOT NULL,
  assignment_class_id BIGINT,
  assignment_name VARCHAR(50),
  submitted DATETIME NOT NULL,
  ip VARCHAR(15) DEFAULT '0.0.0.0'
);

