The JupyterLab devs want to make data science accessible to all, regardless of disability. Unfortunately, in spite of several large-scale pushes over the years, the JupyterLab UI remains of limited use to those with visual or motor impairments. The fundamental issue is that our UI lacks the structure and labeling that would allow it to interface with screen readers, or that would allow our UI to be navigated without a mouse.

The recently convened Jupyter Accessibility Working Group (https://github.com/jupyterlab/team-compass/issues/98#issuecomment-780212986) has formed with the goal of making JupyterLab accessible by improving our UI. Our initial development target is to refactor the existing JupyterLab UI in order to ensure that it is structured and labeled according to the WCAG2.1 standard (https://www.w3.org/TR/WCAG21/). Our goal is to bring full accessibility to JupyterLab by the time we ship v4.0 (end of year 2021).

My talk will cover the various lines of work we are pursuing towards this goal, as well as a more general discussion of the tools and resources we are using to help make this work happen.

- Accessibility development workflows
  - Top-down
    - End-product driven approach
    - Our initial focus is to take the UI that exists, and restructure it to conform to accessibility standards
    - We began at our top-level UI components and have been working our way down to the individual buttons
  - Bottom-up
    - Research driven approach
    - This approach has focused on creating a library of low-level UI components with accessibility baked in
    - This UI component library will then be used to rebuild various sections of JupyterLab from the ground up
    - Ultimately we would like to rebuild the entire UI using these components, but this may not be feasible in the short term

- Resources
  - The standards
  - How to actually learn and interpret the standards
  - Recruiting 3rd party accessibility experts for open-source development work
