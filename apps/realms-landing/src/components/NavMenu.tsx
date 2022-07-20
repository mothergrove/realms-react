import { useState, useEffect } from 'react';
import { ScrollSpy } from '@/util/ScrollSpy';
// Abstracted from ScrollSpy to allow for easier customizations
const onScrollUpdate = (entry: any, isInVewPort: any) => {
  const { target, boundingClientRect } = entry;
  const menuItem = document.querySelector(`[data-scrollspy-id="${target.id}"]`);
  if (boundingClientRect.y <= 0 && isInVewPort) {
    menuItem?.classList.add('font-semibold', 'text-white');
  } else {
    if (menuItem?.classList.contains('font-semibold')) {
      menuItem.classList.remove('font-semibold');
      menuItem.classList.remove('text-white');
    }
  }
};

const NavMenu = ({ options }: any) => {
  // control the click event
  const onClick = (e: any) => {
    e.preventDefault();
    // Set the hash
    window.location.hash = e.target.hash;

    // Scroll to the section + 1 to account for weird bug.
    // remove the `+1` and click on Section 2 link to see the bug.
    const targetSection: HTMLElement | null = document.querySelector(
      `${e.target.hash}`
    );
    if (targetSection) {
      window.scrollTo(0, targetSection.offsetTop + 1);
    }
  };

  return (
    <nav className="pt-8 pr-8 text-xl tracking-widest uppercase sm:block">
      <ul>
        {options.map((option: any) => (
          <li className="my-2" key={option.hash}>
            <a
              href={`#${option.hash}`}
              onClick={onClick}
              data-scrollspy-id={option.hash}
              className={`hover:font-semibold`}
            >
              {option.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export const WithNavMenu = ({ children, selector }: any) => {
  const [options, setOptions] = useState<any>([]);
  useEffect(() => {
    const navMenuSections = document.querySelectorAll(selector);
    const optionsFromSections = Array.from(navMenuSections).map((section) => {
      return {
        hash: section.id,
        title: section.dataset.navTitle,
      };
    });
    setOptions(optionsFromSections);
  }, [selector]);

  return (
    <div className="flex">
      <ScrollSpy handleScroll={onScrollUpdate} />
      <div className="relative pr-14">
        <div className="sticky top-0 hidden  sm:block">
          <NavMenu options={options} />
          <div className="pt-8 pb-16"></div>
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
};
