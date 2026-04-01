import { TextField, TextFieldProps } from '@mui/material';
import { Controller, Control, Path, FieldValues } from 'react-hook-form';

interface FormTextFieldProps<T extends FieldValues> extends Omit<TextFieldProps, 'name' | 'value' | 'onChange'> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
}

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  ...props
}: FormTextFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          {...props}
          label={label}
          error={!!error}
          helperText={error?.message}
          fullWidth
        />
      )}
    />
  );
}
