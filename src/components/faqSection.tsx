import React from 'react';

function FAQSection() {
    const faqData = [
        {
            question: "What is \"Clip Art\"?",
            answer: "Clip Art refers to pre-made images used to illustrate any medium. These images can be illustrations, photographs, or other graphical representations. They are often used in presentations, documents, and various digital media to enhance the visual appeal or convey specific ideas or themes."
        },
        {
            question: "Can I use Clip Art for commercial purposes?",
            answer: "It depends on the licensing of the specific Clip Art. Some Clip Art is available for free and can be used for both personal and commercial purposes, while others may require a license or fee for commercial use. Always check the licensing terms and conditions before using any Clip Art for commercial purposes."
        },
        {
            question: "How is Clip Art different from stock photos?",
            answer: "While both Clip Art and stock photos are pre-made images used to illustrate various media, there are some differences: Clip Art: Typically consists of simple illustrations, icons, or symbols. They are often generic and can be used in a variety of contexts. Stock Photos: These are actual photographs taken by photographers. They can be more detailed and realistic compared to Clip Art."
        },
        {
            question: "Where can I find Clip Art?",
            answer: "There are numerous online platforms and software that offer Clip Art collections. Some popular sources include Clip.Art which contains the largest collection of free Ai-generated clip art, various online Clip Art databases, and graphic design software. Always ensure that you have the right to use the Clip Art, especially if it's for commercial purposes."
        },
        // ... Add other questions similarly ...
    ];

    return (
        <section className="bg-white dark:bg-gray-900">
            <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
                <h2 className="mb-8 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
                    Frequently asked questions
                </h2>
                <div className="grid pt-8 text-left border-t border-gray-200 md:gap-16 dark:border-gray-700 md:grid-cols-2">
                    {faqData.map((faq, index) => (
                        <div key={index} className="mb-10">
                            <h3 className="flex items-center mb-4 text-lg font-medium text-gray-900 dark:text-white">
                                <svg className="flex-shrink-0 mr-2 w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                                </svg>
                                {faq.question}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                {faq.answer}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default FAQSection;
