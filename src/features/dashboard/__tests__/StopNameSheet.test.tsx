import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StopNameSheet, { STOP_NAME_SUGGESTIONS } from '../StopNameSheet';

describe('StopNameSheet', () => {
  const setup = (visible = true) => {
    const onSave = jest.fn();
    const onSkip = jest.fn();
    const utils = render(<StopNameSheet visible={visible} onSave={onSave} onSkip={onSkip} />);
    return { ...utils, onSave, onSkip };
  };

  it('is not shown until a stop has been marked', () => {
    const { queryByTestId } = setup(false);
    expect(queryByTestId('stop-name-sheet')).toBeNull();
  });

  it('cannot save an empty or blank name', () => {
    const { getByTestId, onSave } = setup();
    fireEvent.press(getByTestId('stop-name-save'));
    fireEvent.changeText(getByTestId('stop-name-input'), '    ');
    fireEvent.press(getByTestId('stop-name-save'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves the typed name trimmed', () => {
    const { getByTestId, onSave } = setup();
    fireEvent.changeText(getByTestId('stop-name-input'), "  Nimal's house ");
    fireEvent.press(getByTestId('stop-name-save'));
    expect(onSave).toHaveBeenCalledWith("Nimal's house");
  });

  it('saves from the keyboard Done key too', () => {
    const { getByTestId, onSave } = setup();
    fireEvent.changeText(getByTestId('stop-name-input'), 'School gate');
    fireEvent(getByTestId('stop-name-input'), 'submitEditing');
    expect(onSave).toHaveBeenCalledWith('School gate');
  });

  it('a suggestion fills the box so one tap names the stop', () => {
    const { getByTestId, onSave } = setup();
    fireEvent.press(getByTestId(`stop-name-suggestion-${STOP_NAME_SUGGESTIONS[0]}`));
    expect(getByTestId('stop-name-input').props.value).toBe(STOP_NAME_SUGGESTIONS[0]);
    fireEvent.press(getByTestId('stop-name-save'));
    expect(onSave).toHaveBeenCalledWith(STOP_NAME_SUGGESTIONS[0]);
  });

  it('skipping saves nothing', () => {
    const { getByTestId, onSave, onSkip } = setup();
    fireEvent.changeText(getByTestId('stop-name-input'), 'half typed');
    fireEvent.press(getByTestId('stop-name-skip'));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('starts empty each time it opens', () => {
    const { getByTestId, rerender, onSave, onSkip } = setup();
    fireEvent.changeText(getByTestId('stop-name-input'), 'old name');
    rerender(<StopNameSheet visible={false} onSave={onSave} onSkip={onSkip} />);
    rerender(<StopNameSheet visible onSave={onSave} onSkip={onSkip} />);
    expect(getByTestId('stop-name-input').props.value).toBe('');
  });
});
