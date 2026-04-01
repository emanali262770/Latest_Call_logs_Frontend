import gsap from 'gsap';

export const pageTransition = (element) => {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
  );
};

export const sidebarCollapse = (element, isCollapsed) => {
  if (!element) return;
  gsap.to(element, {
    width: isCollapsed ? 80 : 260,
    duration: 0.4,
    ease: 'power3.inOut',
  });
};

export const modalTransition = (element, isOpen) => {
  if (!element) return;
  if (isOpen) {
    gsap.fromTo(
      element,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
    );
  } else {
    gsap.to(element, { scale: 0.9, opacity: 0, duration: 0.2, ease: 'power2.in' });
  }
};

export const revealForm = (tableRef, formRef, showForm) => {
  if (!tableRef || !formRef) return;
  if (showForm) {
    gsap.to(tableRef, { opacity: 0, y: -20, duration: 0.3, display: 'none' });
    gsap.fromTo(
      formRef,
      { opacity: 0, y: 20, display: 'none' },
      { opacity: 1, y: 0, duration: 0.4, display: 'block', delay: 0.3 }
    );
  } else {
    gsap.to(formRef, { opacity: 0, y: 20, duration: 0.3, display: 'none' });
    gsap.fromTo(
      tableRef,
      { opacity: 0, y: -20, display: 'none' },
      { opacity: 1, y: 0, duration: 0.4, display: 'block', delay: 0.3 }
    );
  }
};
