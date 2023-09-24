import React from 'react';
import Link from 'next/link';


function SignupSection() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-20 lg:py-16 lg:grid-cols-12">
        <div className="w-full p-6 mx-auto bg-white rounded-lg shadow dark:bg-gray-800 sm:max-w-xl lg:col-span-6 sm:p-8">
          <Link href="/" className="inline-flex items-center mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            <img className=" h-8 mr-2" src="https://assets.codepen.io/9394943/color-logo-no-bg.svg" alt="logo" />
          </Link>
          <h1 className="mb-2 text-2xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
            Create your Account
          </h1>
          <p className="text-sm font-light text-gray-500 dark:text-gray-300">
            Access 1,000s of Ai-Generated Clip Art. Already have an account? <Link href="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-500">Login here</Link>.
          </p>
          <form className="mt-4 space-y-6 sm:mt-6" action="#">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
                <input type="email" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name@company.com" required />
              </div>
              <div>
                <label htmlFor="full-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Full Name</label>
                <input type="text" name="full-name" id="full-name" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="e.g. Bonnie Green" required />
              </div>
              <div>
                <label htmlFor="countries" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Country</label>
                <select id="countries" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                  <option selected>Choose a country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="FR">France</option>
                  <option value="DE">Germany</option>
                </select>
              </div>
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                <input type="password" name="password" id="password" placeholder="••••••••" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required />
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-700"></div>
              <div className="px-5 text-center text-gray-500 dark:text-gray-400">or</div>
              <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="space-y-3">
              {/* ... rest of the form fields ... */}
            </div>
            <div className="space-y-3">
              {/* ... rest of the form fields ... */}
            </div>
            <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Create an account</button>
          </form>
        </div>
        <div className="mr-auto place-self-center lg:col-span-6">
          <img className="hidden mx-auto lg:flex" src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/authentication/illustration.svg" alt="illustration" />
        </div>
      </div>
    </section>
  );
}

export default SignupSection;
