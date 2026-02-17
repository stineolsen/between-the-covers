import { Link } from 'react-router-dom';
import BookForm from '../components/books/BookForm';

const AddBook = () => {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        <Link to="/books" className="inline-flex items-center text-gray-600 hover:text-primary mb-6">
          <span className="mr-2">←</span> Back to Books
        </Link>

        <BookForm />
      </div>
    </div>
  );
};

export default AddBook;
