import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip as CarbonTooltip } from 'carbon-components-react';

import { settings } from '../../constants/Settings';

const { iotPrefix } = settings;

const DIRECTION_LEFT = 'left';
const DIRECTION_TOP = 'top';
const DIRECTION_RIGHT = 'right';
const DIRECTION_BOTTOM = 'bottom';

const FloatingMenuContainer = props => {
  const { children } = props;
  return (
    <span className={`${iotPrefix}--tooltip__floating-menu-container`} data-floating-menu-container>
      {children}
    </span>
  );
};

/**
 * This component extends the Carbon tooltip by simplifying the process
 * of getting the tooltip floating menu to follow the triggering element
 * when the user scrolls a page/container that has fixed position.
 */
const Tooltip = React.forwardRef((props, ref) => {
  const { children, scrollWithTriggerElement, menuOffset, ...other } = props;
  const scrollMenuOffset =
    menuOffset || !scrollWithTriggerElement
      ? menuOffset
      : (menuBody, menuDirection) => {
          const container = menuBody.closest('[data-floating-menu-container]');
          const caretHeight = 7;
          const { x: triggerX, y: triggerY } = container.getBoundingClientRect();

          let offset;
          switch (menuDirection) {
            case DIRECTION_BOTTOM:
              offset = {
                top: -triggerY + caretHeight,
                left: -triggerX,
              };
              break;
            case DIRECTION_TOP:
              offset = {
                top: triggerY + caretHeight,
                left: -triggerX,
              };
              break;
            case DIRECTION_LEFT:
              console.error(
                'Position LEFT is not automatically supported but must be handled on an individual basis.'
              );
              break;
            case DIRECTION_RIGHT:
              offset = {
                top: -triggerY,
                left: -triggerX + caretHeight,
              };
            default:
              break;
          }
          return offset;
        };

  const tooltip = (
    <CarbonTooltip {...other} menuOffset={scrollMenuOffset} ref={ref}>
      {children}
    </CarbonTooltip>
  );

  return scrollWithTriggerElement ? (
    <FloatingMenuContainer>{tooltip}</FloatingMenuContainer>
  ) : (
    tooltip
  );
});

Tooltip.displayName = 'iot-Tooltip';
Tooltip.propTypes = {
  /**
   * Where to put the tooltip, relative to the trigger UI.
   */
  direction: PropTypes.oneOf(['bottom', 'top', 'left', 'right']),

  /**
   * Extends the Carbon tooltip by simplifying the process
   * of getting the tooltip floating menu to follow the triggering element
   * when the user scrolls the page/container
   */
  scrollWithTriggerElement: PropTypes.bool,
};

Tooltip.defaultProps = {
  direction: DIRECTION_BOTTOM,
  scrollWithTriggerElement: false,
};

export default Tooltip;
